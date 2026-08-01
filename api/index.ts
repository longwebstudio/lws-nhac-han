import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json({ limit: "10mb" }));

const getOAuth2Client = (req: express.Request) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET || "";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Endpoint 1: Get Google Auth URL
app.get("/api/auth/google/url", (req, res) => {
  try {
    const oauth2Client = getOAuth2Client(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/contacts",
        "https://www.googleapis.com/auth/contacts.readonly",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ],
      prompt: "consent"
    });
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate Auth URL" });
  }
});

// Endpoint 2: Google OAuth Callback
app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("Không thấy mã xác thực Google");
    }

    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Google Contacts Callback</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h2 { color: #38bdf8; margin-top: 0; }
          p { color: #94a3b8; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Đã kết nối Google!</h2>
          <p>Đang đồng bộ danh bạ vào ứng dụng. Cửa sổ này sẽ tự động đóng...</p>
        </div>
        <script>
          const tokensData = ${JSON.stringify(tokens)};
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: tokensData }, '*');
            setTimeout(() => { window.close(); }, 800);
          } else {
            window.location.href = '/?google_auth=success&tokens=' + encodeURIComponent(JSON.stringify(tokensData));
          }
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`Xác thực thất bại: ${err.message || 'Lỗi không xác định'}`);
  }
});

// Endpoint 3: Fetch Google Contacts
app.post("/api/google/contacts", async (req, res) => {
  try {
    const { tokens, pageToken } = req.body;
    if (!tokens) {
      return res.status(400).json({ error: "Thiếu thông tin xác thực (tokens)" });
    }

    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const people = google.people({ version: "v1", auth: oauth2Client });
    const response = await people.people.connections.list({
      resourceName: "people/me",
      pageSize: 1000,
      pageToken,
      personFields: "names,phoneNumbers,emailAddresses,addresses,birthdays,biographies,organizations",
    });

    const connections = response.data.connections || [];
    const nextPageToken = response.data.nextPageToken;

    const contacts = connections.map(person => {
      const primaryName = person.names?.[0]?.displayName || person.names?.[0]?.givenName || "Chưa có tên";
      const phone = person.phoneNumbers?.[0]?.value || "";
      const email = person.emailAddresses?.[0]?.value || "";
      const address = person.addresses?.[0]?.formattedValue || "";
      const note = person.biographies?.[0]?.value || "";

      let birthday = "";
      if (person.birthdays?.[0]?.date) {
        const d = person.birthdays[0].date;
        if (d.year && d.month && d.day) {
          birthday = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
        } else if (d.month && d.day) {
          birthday = `--${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
        }
      }

      return {
        resourceName: person.resourceName,
        fullName: primaryName,
        phone: phone.replace(/\s+/g, ""),
        email,
        address,
        birthday,
        notes: note,
      };
    });

    res.json({
      contacts,
      nextPageToken,
      totalItems: response.data.totalItems || contacts.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Không thể lấy danh sách danh bạ từ Google" });
  }
});

// Endpoint 4: Create/Export Contacts to Google Contacts
app.post("/api/google/contacts/create", async (req, res) => {
  try {
    const { tokens, customers } = req.body;
    if (!tokens) {
      return res.status(400).json({ error: "Thiếu thông tin xác thực (tokens)" });
    }
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: "Danh sách người dân cần xuất rỗng" });
    }

    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(tokens);

    const people = google.people({ version: "v1", auth: oauth2Client });
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const cust of customers) {
      try {
        const notesParts = [];
        if (cust.cccd) notesParts.push(`CCCD: ${cust.cccd}`);
        if (cust.insuranceCode) notesParts.push(`Mã BHYT: ${cust.insuranceCode}`);
        if (cust.insuranceCodeBHXH) notesParts.push(`Mã BHXH: ${cust.insuranceCodeBHXH}`);
        if (cust.notes) notesParts.push(`Ghi chú: ${cust.notes}`);

        const requestBody: any = {
          names: [{ givenName: cust.name || "Người dân" }],
        };

        if (cust.phone) {
          requestBody.phoneNumbers = [{ value: cust.phone, type: "mobile" }];
        }

        if (cust.address) {
          requestBody.addresses = [{ formattedValue: cust.address, type: "home" }];
        }

        if (notesParts.length > 0) {
          requestBody.biographies = [{ value: notesParts.join(" | ") }];
        }

        if (cust.birthday) {
          const parts = cust.birthday.split("-");
          if (parts.length === 3) {
            requestBody.birthdays = [
              {
                date: {
                  year: parseInt(parts[0]),
                  month: parseInt(parts[1]),
                  day: parseInt(parts[2]),
                }
              }
            ];
          }
        }

        const response = await people.people.createContact({ requestBody });
        results.push({ name: cust.name, status: "success", resourceName: response.data.resourceName });
        successCount++;
      } catch (err: any) {
        results.push({ name: cust.name, status: "failed", error: err.message });
        failCount++;
      }
    }

    res.json({
      message: `Đã hoàn tất đồng bộ ${successCount}/${customers.length} người dân lên Google Contacts`,
      successCount,
      failCount,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Không thể xuất danh bạ lên Google Contacts" });
  }
});

export default app;
