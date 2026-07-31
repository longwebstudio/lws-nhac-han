/**
 * WordPress GraphQL (WPGraphQL) Integration Engine
 * Handles user login / registration with JWT Authentication, and
 * cloud synchronization of BHYT / BHXH database using WordPress private posts as cloud storage.
 */

export interface WPUser {
  id: string;
  databaseId: number;
  username: string;
  email: string;
  name?: string;
}

export interface WPLoginResponse {
  authToken: string;
  user: WPUser;
}

// Configurable WordPress GraphQL endpoints with reasonable defaults
export const DEFAULT_ENDPOINT = 'https://longwebstudio.io.vn/wordpress/5ryt3z3skdlf';

export function getStoredWordPressUrl(): string {
  const customUrl = localStorage.getItem('lws_wp_graphql_url');
  return customUrl && customUrl.trim() ? customUrl.trim() : DEFAULT_ENDPOINT;
}

export function setStoredWordPressUrl(url: string) {
  const trimmed = url ? url.trim() : '';
  if (!trimmed || trimmed === DEFAULT_ENDPOINT) {
    localStorage.removeItem('lws_wp_graphql_url');
  } else {
    localStorage.setItem('lws_wp_graphql_url', trimmed);
  }
}

export function getStoredWPToken(): string | null {
  return localStorage.getItem('lws_wp_jwt_token');
}

export function getStoredWPUser(): WPUser | null {
  const data = localStorage.getItem('lws_wp_user_info');
  return data ? JSON.parse(data) : null;
}

export function clearWPAuth() {
  localStorage.removeItem('lws_wp_jwt_token');
  localStorage.removeItem('lws_wp_user_info');
}

/**
 * Execute generic GraphQL Query / Mutation on target Wordpress server
 */
export async function runWPGraphQLQuery(query: string, variables: Record<string, any> = {}) {
  const url = getStoredWordPressUrl();
  const token = getStoredWPToken();

  const primaryHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'lws-secret-token': 'LongWebStudio_GraphQL_Secure_Key_2026',
  };

  if (token) {
    primaryHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: primaryHeaders,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Máy chủ WordPress phản hồi lỗi HTTP ${response.status} (${response.statusText}).`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    return json.data;
  } catch (err: any) {
    // If custom header 'lws-secret-token' fails CORS preflight or network error occurs, attempt standard fetch
    if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message?.includes('fetch'))) {
      try {
        const fallbackHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          fallbackHeaders['Authorization'] = `Bearer ${token}`;
        }
        const fallbackResp = await fetch(url, {
          method: 'POST',
          headers: fallbackHeaders,
          body: JSON.stringify({ query, variables }),
        });
        if (!fallbackResp.ok) {
          throw new Error(`Máy chủ WordPress phản hồi lỗi HTTP ${fallbackResp.status} (${fallbackResp.statusText}).`);
        }
        const fallbackJson = await fallbackResp.json();
        if (fallbackJson.errors && fallbackJson.errors.length > 0) {
          throw new Error(fallbackJson.errors[0].message);
        }
        return fallbackJson.data;
      } catch (fallbackErr: any) {
        throw new Error('Không thể kết nối tới máy chủ WordPress (Failed to fetch). Vui lòng kiểm tra lại URL Endpoint WPGraphQL, kết nối mạng hoặc cấu hình CORS.');
      }
    }
    throw err;
  }
}

/**
 * Log in via WPGraphQL & JWT Authentication
 */
export async function loginToWordPress(username: string, password: string): Promise<WPLoginResponse> {
  const query = `
    mutation LoginUser($username: String!, $password: String!) {
      login(input: {
        username: $username,
        password: $password
      }) {
        authToken
        user {
          id
          databaseId
          username
          email
          name
        }
      }
    }
  `;

  const data = await runWPGraphQLQuery(query, { username, password });
  
  if (!data?.login?.authToken) {
    throw new Error('Đăng nhập không trả về mã token hợp lệ. Vui lòng kiểm tra lại cấu hình JWT.');
  }

  const authData: WPLoginResponse = {
    authToken: data.login.authToken,
    user: data.login.user,
  };

  // Persist locally
  localStorage.setItem('lws_wp_jwt_token', authData.authToken);
  localStorage.setItem('lws_wp_user_info', JSON.stringify(authData.user));

  return authData;
}

/**
 * Log in via custom WPGraphQL loginWithFirebase mutation using Firebase ID Token
 */
export async function loginWithFirebaseToWordPress(idToken: string): Promise<WPLoginResponse> {
  const query = `
    mutation LoginWithFirebase($idToken: String!) {
      loginWithFirebase(input: { idToken: $idToken }) {
        authToken
        user {
          id
          databaseId
          username
          email
          name
        }
      }
    }
  `;

  const data = await runWPGraphQLQuery(query, { idToken });
  
  if (!data?.loginWithFirebase?.authToken) {
    throw new Error('Đăng nhập Firebase không trả về mã token WordPress hợp lệ.');
  }

  const authData: WPLoginResponse = {
    authToken: data.loginWithFirebase.authToken,
    user: data.loginWithFirebase.user,
  };

  // Persist locally
  localStorage.setItem('lws_wp_jwt_token', authData.authToken);
  localStorage.setItem('lws_wp_user_info', JSON.stringify(authData.user));

  return authData;
}

/**
 * Register a new user in WordPress
 */
export async function registerToWordPress(username: string, email: string, password: string): Promise<WPUser> {
  const query = `
    mutation RegisterUser($username: String!, $email: String!, $password: String!) {
      registerUser(input: {
        username: $username,
        email: $email,
        password: $password
      }) {
        user {
          id
          databaseId
          username
          email
          name
        }
      }
    }
  `;

  const data = await runWPGraphQLQuery(query, { username, email, password });

  if (!data?.registerUser?.user) {
    throw new Error('Không thể đăng ký tài khoản mới. Vui lòng liên hệ quản trị viên WordPress.');
  }

  return data.registerUser.user;
}

/**
 * Upload backup payload (customers and agency settings) directly to WordPress custom table wp_lws_so_thu via WPGraphQL
 */
export async function saveBackupToWordPress(payload: { customers: any[]; settings: any }) {
  const customersJson = JSON.stringify(payload.customers || []);
  const settingsJson = JSON.stringify(payload.settings || {});

  const customTableMutation = `
    mutation SaveLwsSoThuBackup($customersJson: String!, $settingsJson: String!) {
      saveLwsSoThuBackup(input: {
        customersJson: $customersJson,
        settingsJson: $settingsJson
      }) {
        success
        message
        updatedAt
      }
    }
  `;

  try {
    const customResult = await runWPGraphQLQuery(customTableMutation, { customersJson, settingsJson });
    if (customResult?.saveLwsSoThuBackup?.success) {
      console.log('Successfully saved online customer data & agency settings to WordPress custom table wp_lws_so_thu via WPGraphQL!');
      return { success: true, updatedAt: customResult.saveLwsSoThuBackup.updatedAt };
    }
  } catch (err: any) {
    console.warn('Primary mutation saveLwsSoThuBackup failed:', err);
    
    // Fallback to legacy mutation name
    try {
      const legacyMutation = `
        mutation SaveLwsCustomTableBackup($customersJson: String!, $settingsJson: String!) {
          saveLwsCustomTableBackup(input: {
            customersJson: $customersJson,
            settingsJson: $settingsJson
          }) {
            success
            message
            updatedAt
          }
        }
      `;
      const legacyResult = await runWPGraphQLQuery(legacyMutation, { customersJson, settingsJson });
      if (legacyResult?.saveLwsCustomTableBackup?.success) {
        console.log('Successfully saved online data via legacy WPGraphQL mutation!');
        return { success: true, updatedAt: legacyResult.saveLwsCustomTableBackup.updatedAt };
      }
    } catch (legacyErr: any) {
      console.warn('Legacy mutation saveLwsCustomTableBackup failed:', legacyErr);
      const msg = legacyErr?.message || err?.message || '';
      if (msg.includes('customersJson') || msg.includes('SaveLwsCustomTableBackupInput') || msg.includes('SaveLwsSoThuBackupInput')) {
        throw new Error('Plugin WordPress chưa khai báo trường customersJson trong WPGraphQL. Vui lòng tải lại mã Nguồn Plugin LWS Sổ Thu (lws-so-thu.php v1.2.0) trong mục "Cấu hình WPGraphQL"!');
      }
      throw new Error(`Lỗi đồng bộ WordPress: ${msg}`);
    }
  }

  throw new Error('Không thể lưu dữ liệu vào bảng riêng wp_lws_so_thu trên WordPress. Vui lòng cài đặt Plugin lws-so-thu.');
}

/**
 * Fetch backup payload (customers and agency settings) directly from WordPress custom table wp_lws_so_thu via WPGraphQL
 */
export async function getBackupFromWordPress(): Promise<{ 
  customers: any[]; 
  settings: any; 
  updatedAt: string; 
  agentName?: string; 
  agentPhone?: string; 
} | null> {
  const customTableQuery = `
    query GetLwsSoThuBackup {
      lwsSoThuBackup {
        userId
        agentName
        agentPhone
        customersJson
        settingsJson
        updatedAt
      }
    }
  `;

  let backupObj: any = null;
  try {
    const customData = await runWPGraphQLQuery(customTableQuery, {});
    backupObj = customData?.lwsSoThuBackup;
  } catch (e) {
    const legacyQuery = `
      query GetLwsCustomTableBackup {
        lwsCustomTableBackup {
          userId
          agentName
          agentPhone
          customersJson
          settingsJson
          updatedAt
        }
      }
    `;
    const legacyData = await runWPGraphQLQuery(legacyQuery, {});
    backupObj = legacyData?.lwsCustomTableBackup;
  }

  if (!backupObj) {
    return null;
  }

  let custs: any[] = [];
  let sets: any = {};

  if (backupObj.customersJson) {
    try {
      custs = JSON.parse(backupObj.customersJson);
    } catch (e) {
      console.warn('Could not parse customersJson from custom table:', e);
    }
  }

  if (backupObj.settingsJson) {
    try {
      sets = JSON.parse(backupObj.settingsJson);
    } catch (e) {
      console.warn('Could not parse settingsJson from custom table:', e);
    }
  }

  if (Array.isArray(custs)) {
    console.log('Successfully restored online customer data & agency settings from WordPress custom table wp_lws_so_thu via WPGraphQL!');
    return { 
      customers: custs, 
      settings: sets,
      updatedAt: backupObj.updatedAt || '',
      agentName: backupObj.agentName || '',
      agentPhone: backupObj.agentPhone || ''
    };
  }

  return null;
}

export const WORDPRESS_SQL_CODE = `
-- 1. Script SQL khởi tạo bảng riêng wp_lws_so_thu trong MySQL WordPress (Mỗi User 1 Sổ Thu)
CREATE TABLE IF NOT EXISTS \`wp_lws_so_thu\` (
  \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  \`user_id\` bigint(20) UNSIGNED NOT NULL,
  \`agent_name\` varchar(255) DEFAULT '',
  \`agent_phone\` varchar(50) DEFAULT '',
  \`customer_id\` varchar(100) NOT NULL,
  \`customer_name\` varchar(255) NOT NULL,
  \`phone\` varchar(50) DEFAULT '',
  \`cccd\` varchar(50) DEFAULT '',
  \`data_json\` longtext NOT NULL,
  \`settings_json\` longtext DEFAULT NULL,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`user_id\` (\`user_id\`),
  KEY \`customer_id\` (\`customer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`.trim();

export const WORDPRESS_PHP_CUSTOM_TABLE_CODE = `
<?php
/**
 * Plugin Name: LWS Sổ Thu (lws-so-thu) - Custom Table & WPGraphQL Integration
 * Plugin URI: https://longwebstudio.net
 * Description: Plugin LWS Sổ Thu tạo bảng riêng wp_lws_so_thu trong MySQL. Mỗi user sở hữu 1 sổ thu chứa danh sách khách hàng và cấu hình cá nhân, mở rộng API WPGraphQL giúp khôi phục dữ liệu trên thiết bị mới dễ dàng.
 * Author: Freelancer Long Web Studio
 * Version: 1.2.0
 */

if (!defined('ABSPATH')) exit;

// 1. Khởi tạo bảng riêng wp_lws_so_thu trong MySQL (Mỗi user 1 Sổ Thu)
function lws_create_custom_tables() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'lws_so_thu';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id bigint(20) UNSIGNED NOT NULL,
        agent_name varchar(255) DEFAULT '',
        agent_phone varchar(50) DEFAULT '',
        customer_id varchar(100) NOT NULL,
        customer_name varchar(255) NOT NULL,
        phone varchar(50) DEFAULT '',
        cccd varchar(50) DEFAULT '',
        data_json longtext NOT NULL,
        settings_json longtext DEFAULT NULL,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY user_id (user_id),
        KEY customer_id (customer_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
register_activation_hook(__FILE__, 'lws_create_custom_tables');

// 2. Đăng ký WPGraphQL Type, RootQuery và Mutation
add_action('graphql_register_types', function() {
    register_graphql_object_type('LwsSoThuBackup', [
        'description' => 'LWS Sổ Thu Bảo Hiểm Custom Table Backup',
        'fields' => [
            'userId' => ['type' => 'Int'],
            'agentName' => ['type' => 'String'],
            'agentPhone' => ['type' => 'String'],
            'customersJson' => ['type' => 'String'],
            'settingsJson' => ['type' => 'String'],
            'updatedAt' => ['type' => 'String'],
        ]
    ]);

    $resolver = function($root, $args, $context) {
        $user_id = get_current_user_id();
        if (!$user_id) return null;

        global $wpdb;
        $table_name = $wpdb->prefix . 'lws_so_thu';
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE user_id = %d LIMIT 1", $user_id));

        if (!$row) return null;

        return [
            'userId' => (int)$row->user_id,
            'agentName' => isset($row->agent_name) ? $row->agent_name : '',
            'agentPhone' => isset($row->agent_phone) ? $row->agent_phone : '',
            'customersJson' => $row->data_json,
            'settingsJson' => isset($row->settings_json) ? $row->settings_json : '',
            'updatedAt' => $row->updated_at,
        ];
    };

    register_graphql_field('RootQuery', 'lwsSoThuBackup', [
        'type' => 'LwsSoThuBackup',
        'description' => 'Lấy dữ liệu sổ thu của user từ bảng riêng wp_lws_so_thu',
        'resolve' => $resolver
    ]);

    register_graphql_field('RootQuery', 'lwsCustomTableBackup', [
        'type' => 'LwsSoThuBackup',
        'description' => 'Alias lwsCustomTableBackup',
        'resolve' => $resolver
    ]);

    $mutationHandler = function($input, $context) {
        $user_id = get_current_user_id();
        if (!$user_id) {
            throw new \\GraphQL\\Error\\UserError('Bạn cần đăng nhập tài khoản WordPress để lưu dữ liệu sổ thu.');
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'lws_so_thu';
        $customers_json = isset($input['customersJson']) ? $input['customersJson'] : '[]';
        $settings_json = isset($input['settingsJson']) ? $input['settingsJson'] : '{}';
        
        $settings_obj = json_decode($settings_json, true);
        $agent_name = (is_array($settings_obj) && isset($settings_obj['agencyName'])) ? $settings_obj['agencyName'] : '';
        $agent_phone = (is_array($settings_obj) && isset($settings_obj['agentPhone'])) ? $settings_obj['agentPhone'] : '';
        
        $now = current_time('mysql');

        $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE user_id = %d LIMIT 1", $user_id));

        if ($existing) {
            $wpdb->update(
                $table_name,
                [
                    'agent_name' => $agent_name,
                    'agent_phone' => $agent_phone,
                    'data_json' => $customers_json,
                    'settings_json' => $settings_json,
                    'updated_at' => $now
                ],
                ['id' => $existing],
                ['%s', '%s', '%s', '%s', '%s'],
                ['%d']
            );
        } else {
            $wpdb->insert(
                $table_name,
                [
                    'user_id' => $user_id,
                    'agent_name' => $agent_name,
                    'agent_phone' => $agent_phone,
                    'customer_id' => 'so_thu_' . $user_id,
                    'customer_name' => ($agent_name ? $agent_name : 'LWS Agent') . ' (' . $user_id . ')',
                    'data_json' => $customers_json,
                    'settings_json' => $settings_json,
                    'updated_at' => $now
                ],
                ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
            );
        }

        return [
            'success' => true,
            'message' => 'Lưu dữ liệu sổ thu (khách hàng & thông tin nhân viên thu) thành công vào bảng riêng wp_lws_so_thu!',
            'updatedAt' => $now
        ];
    };

    $mutationConfig = [
        'inputFields' => [
            'customersJson' => ['type' => 'String'],
            'settingsJson' => ['type' => 'String'],
        ],
        'outputFields' => [
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
            'updatedAt' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => $mutationHandler
    ];

    register_graphql_mutation('saveLwsSoThuBackup', $mutationConfig);
    register_graphql_mutation('saveLwsCustomTableBackup', $mutationConfig);
});
`.trim();

