import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // OAuth Client Builder
  const getOAuth2Client = (req: express.Request) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
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
      console.error("Error generating Google Auth URL:", err);
      res.status(500).json({ error: err.message || "Failed to generate Auth URL" });
    }
  });

  // Endpoint 2: Google OAuth Callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).send("Không thấy mã xác thực Google (authorization code)");
      }

      const oauth2Client = getOAuth2Client(req);
      const { tokens } = await oauth2Client.getToken(code);

      // Return popup callback script that passes tokens back to parent window
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
      console.error("Google Auth Callback Error:", err);
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
      console.error("Fetch Google Contacts Error:", err);
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
          // Construct notes/biography text
          const notesParts = [];
          if (cust.cccd) notesParts.push(`CCCD: ${cust.cccd}`);
          if (cust.insuranceCode) notesParts.push(`Mã BHYT: ${cust.insuranceCode}`);
          if (cust.insuranceCodeBHXH) notesParts.push(`Mã BHXH: ${cust.insuranceCodeBHXH}`);
          if (cust.notes) notesParts.push(`Ghi chú: ${cust.notes}`);

          // Helper to extract birth year from birthday string or 12-digit CCCD
          const extractBirthYear = (birthday?: string, cccd?: string): string | null => {
            if (birthday) {
              const str = String(birthday).trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                return str.substring(0, 4);
              }
              const match = str.match(/\b(19\d\d|20\d\d)\b/);
              if (match) return match[1];
            }
            if (cccd) {
              const cleanCCCD = String(cccd).trim().replace(/\D/g, '');
              if (cleanCCCD.length === 12) {
                const genderCenturyDigit = parseInt(cleanCCCD[3], 10);
                const yy = cleanCCCD.substring(4, 6);
                let century = 1900;
                if (genderCenturyDigit === 0 || genderCenturyDigit === 1) century = 1900;
                else if (genderCenturyDigit === 2 || genderCenturyDigit === 3) century = 2000;
                else if (genderCenturyDigit === 4 || genderCenturyDigit === 5) century = 2100;
                const year = century + parseInt(yy, 10);
                if (year >= 1920 && year <= 2030) return String(year);
              }
            }
            return null;
          };

          const birthYear = extractBirthYear(cust.birthday, cust.cccd);
          let givenName = (cust.name || "Người dân").trim();
          if (birthYear && !givenName.includes(birthYear)) {
            givenName = `${givenName} ${birthYear}`;
          }

          const requestBody: any = {
            names: [{ givenName }],
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
          console.error(`Failed to create contact for ${cust.name}:`, err);
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
      console.error("Export Google Contacts Error:", err);
      res.status(500).json({ error: err.message || "Không thể xuất danh bạ lên Google Contacts" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
