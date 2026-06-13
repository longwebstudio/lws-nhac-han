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
export const DEFAULT_ENDPOINT = 'https://longwebstudio.net/wordpress/rYkOy1HCCRD0JZZcrshVYaUR39QfcG15QWUC437BMM5Pk3gNLu';

export function getStoredWordPressUrl(): string {
  return DEFAULT_ENDPOINT;
}

export function setStoredWordPressUrl(url: string) {
  // Always use DEFAULT_ENDPOINT
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
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
 * Upload backup payload to WordPress private posts
 * This wraps the customer database and settings and stores it safely on the web server.
 */
export async function saveBackupToWordPress(payload: { customers: any[]; settings: any }) {
  const serialized = JSON.stringify(payload);
  const title = "Lws Nhắc Hạn Cloud Backup";
  const currentUser = getStoredWPUser();
  const authorId = currentUser ? currentUser.databaseId : undefined;

  // First, search if a backup post already exists
  const searchQuery = `
    query FindBackupPosts($authorId: Int) {
      posts(where: { status: PRIVATE, author: $authorId }) {
        nodes {
          id
          title
          content
          author {
            node {
              databaseId
              username
            }
          }
        }
      }
    }
  `;

  let existingPostId: string | null = null;
  try {
    const listData = await runWPGraphQLQuery(searchQuery, authorId !== undefined ? { authorId } : {});
    const existingNode = listData?.posts?.nodes?.find((node: any) => {
      const matchesTitle = node.title === title;
      const matchesAuthor = currentUser ? (node.author?.node?.databaseId === currentUser.databaseId) : true;
      return matchesTitle && matchesAuthor;
    });
    if (existingNode) {
      existingPostId = existingNode.id;
    }
  } catch (err) {
    console.warn("Could not find existing backup node, creating new...", err);
  }

  if (existingPostId) {
    // Update existing
    const updateMutation = `
      mutation UpdateBackupPost($id: ID!, $content: String!) {
        updatePost(input: {
          id: $id,
          content: $content
        }) {
          post {
            id
            title
          }
        }
      }
    `;
    await runWPGraphQLQuery(updateMutation, { id: existingPostId, content: serialized });
  } else {
    // Create new private post
    const createMutation = `
      mutation CreateBackupPost($title: String!, $content: String!) {
        createPost(input: {
          title: $title,
          content: $content,
          status: PRIVATE
        }) {
          post {
            id
            title
          }
        }
      }
    `;
    await runWPGraphQLQuery(createMutation, { title, content: serialized });
  }
}

/**
 * Fetch backup payload from WordPress private posts
 */
export async function getBackupFromWordPress(): Promise<{ customers: any[]; settings: any } | null> {
  const title = "Lws Nhắc Hạn Cloud Backup";
  const currentUser = getStoredWPUser();
  const authorId = currentUser ? currentUser.databaseId : undefined;

  const searchQuery = `
    query FetchBackupPosts($authorId: Int) {
      posts(where: { status: PRIVATE, author: $authorId }) {
        nodes {
          id
          title
          content
          author {
            node {
              databaseId
              username
            }
          }
        }
      }
    }
  `;

  const data = await runWPGraphQLQuery(searchQuery, authorId !== undefined ? { authorId } : {});
  const node = data?.posts?.nodes?.find((node: any) => {
    const matchesTitle = node.title === title;
    const matchesAuthor = currentUser ? (node.author?.node?.databaseId === currentUser.databaseId) : true;
    return matchesTitle && matchesAuthor;
  });

  if (!node || !node.content) {
    return null;
  }

  // Strip WordPress HTML paragraph wrapping if WordPress parsed it
  let contentText = node.content.trim();
  if (contentText.startsWith('<p>') && contentText.endsWith('</p>')) {
    contentText = contentText.slice(3, -4);
  }
  // Decode HTML entities if WordPress encoded quotes
  contentText = contentText
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  try {
    return JSON.parse(contentText);
  } catch (err) {
    console.error("Failed to parse serialized backup content from WordPress:", err);
    throw new Error("Dữ liệu sao lưu trên WordPress không đúng định dạng JSON. Vui lòng tải lên thủ công.");
  }
}
