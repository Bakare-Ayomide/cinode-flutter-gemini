import mysql from "mysql2/promise";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = 3000;

// Multer setup for file storage
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : 'uploads/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Ensure uploads directory exists
async function ensureUploadsDir() {
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
        console.error("Failed to create uploads directory", err);
    }
}
ensureUploadsDir();

// Serve uploads folder
app.use('/uploads', express.static(uploadDir));

app.use(cors());
app.use(express.json());

// MySQL Database Setup with timeout and connection testing
const pool = mysql.createPool({
    host: process.env.DB_HOST || "131.153.147.178",
    user: process.env.DB_USER || "zerolord_cinode",
    password: process.env.DB_PASSWORD || "@F33rinimicinode",
    database: process.env.DB_NAME || "zerolord_cinode",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000, 
    enableKeepAlive: true,
    keepAliveInitialDelay: 5000,
    // Add these to handle aggressive server timeouts
    maxIdle: 5, // Keep some idle connections to speed up requests
    idleTimeout: 30000 // Close connections after 30s of inactivity to stay under server 60s timeout
});

let dbReady = false;
let dbError: string | null = null;
let settingsCache: Record<string, string> = {};
let lastSettingsFetch = 0;

async function fetchSettings() {
    const now = Date.now();
    if (now - lastSettingsFetch < 60000 && Object.keys(settingsCache).length > 0) {
        return settingsCache;
    }

    try {
        const [rows]: any = await pool.execute('SELECT setting_key, setting_value FROM system_settings');
        const newCache: Record<string, string> = {};
        rows.forEach((row: any) => {
            newCache[row.setting_key] = row.setting_value;
        });
        settingsCache = newCache;
        lastSettingsFetch = now;
        return settingsCache;
    } catch (err) {
        console.error("Failed to fetch settings from DB, using cache or defaults");
        return settingsCache;
    }
}

async function initDB() {
  console.log("Initializing database connection...");
  try {
    // Test connection first
    const connection = await pool.getConnection();
    console.log("Database connection established.");
    connection.release();

    // Create tables if they don't exist
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            is_premium BOOLEAN DEFAULT FALSE,
            premium_since DATETIME,
            premium_plan VARCHAR(50),
            last_transaction_id VARCHAR(255),
            settings JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    // Migrating existing users to have a settings column if they don't
    try {
        await pool.execute('ALTER TABLE users ADD COLUMN settings JSON AFTER last_transaction_id');
    } catch (e) {
        // Column probably already exists
    }

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS media_overrides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tmdb_id VARCHAR(50) NOT NULL,
            media_type VARCHAR(20) NOT NULL,
            title VARCHAR(255),
            season_number INT,
            episode_number INT,
            video_url TEXT,
            intro_start INT,
            intro_end INT,
            custom_title VARCHAR(255),
            custom_overview TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS watchlists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            movie_id VARCHAR(50) NOT NULL,
            title VARCHAR(255),
            poster_path TEXT,
            media_type VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_movie (user_email, movie_id),
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            movie_id VARCHAR(50) NOT NULL,
            media_type VARCHAR(20) NOT NULL,
            rating INT,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            movie_id VARCHAR(50) NOT NULL,
            title VARCHAR(255),
            poster_path TEXT,
            media_type VARCHAR(20),
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_movie (user_email, movie_id),
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS downloads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            movie_id VARCHAR(50) NOT NULL,
            title VARCHAR(255),
            poster_path TEXT,
            media_type VARCHAR(20),
            local_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_movie (user_email, movie_id),
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    // Payments
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS payment_config (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bank_name VARCHAR(255),
            account_name VARCHAR(255),
            account_number VARCHAR(255),
            crypto_address VARCHAR(255),
            other_method TEXT,
            payment_note TEXT,
            tracking_questions JSON,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS payment_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            plan VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            sender_name VARCHAR(255),
            transaction_reference VARCHAR(255),
            referral_code VARCHAR(50),
            tracking_answers JSON,
            proof_image_url TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            plan VARCHAR(50) NOT NULL,
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiry_date DATETIME NOT NULL,
            status ENUM('active', 'expired') DEFAULT 'active',
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    // Affiliates
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS affiliates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) UNIQUE NOT NULL,
            referral_code VARCHAR(50) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS referrals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            affiliate_id INT NOT NULL,
            referred_user_email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
            FOREIGN KEY (referred_user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS affiliate_earnings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            affiliate_id INT NOT NULL,
            payment_submission_id INT NOT NULL,
            amount DECIMAL(10,2) DEFAULT 100.00,
            status ENUM('pending', 'paid') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
            FOREIGN KEY (payment_submission_id) REFERENCES payment_submissions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    // Ads
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS ads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type ENUM('image', 'video', 'html') NOT NULL,
            media_url TEXT,
            html_content TEXT,
            click_url TEXT,
            placement VARCHAR(50) NOT NULL,
            priority INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            start_date DATETIME,
            end_date DATETIME,
            impressions INT DEFAULT 0,
            clicks INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    // Notifications
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
            target_type ENUM('all', 'user') DEFAULT 'all',
            target_user_email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            notification_id INT NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    // Bootstrap initial payment config if not exists
    const [configRows]: any = await pool.execute('SELECT * FROM payment_config LIMIT 1');
    if (configRows.length === 0) {
        await pool.execute(`
            INSERT INTO payment_config (bank_name, account_name, account_number, payment_note, tracking_questions)
            VALUES (?, ?, ?, ?, ?)
        `, ['Cinode Bank', 'Cinode Admin', '0123456789', 'Use your email as the transaction description', '[]']);
    }

    // Bootstrap initial admins
    const admins = ['contactzerolord@gmail.com', 'earr.music@gmail.com'];
    for (const email of admins) {
        await pool.execute(
            'INSERT INTO users (email, is_admin) VALUES (?, 1) ON DUPLICATE KEY UPDATE is_admin = 1',
            [email]
        );
    }

    // Seed default settings if they don't exist
    const defaultSettings: Record<string, string> = {
        'TMDB_API_KEY': DEFAULT_TMDB_API_KEY,
        'premium_price_monthly': '9.99',
        'payment_info': 'Cinode Master Vault: PayPal admin@example.com (Contact admin for bulk)',
        'allow_downloads': 'true'
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
        await pool.execute(
            'INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
            [key, value]
        );
    }

    dbReady = true;
    dbError = null;
    console.log("MySQL Database structures verified and seeded.");
    await fetchSettings();
  } catch (err: any) {
    dbReady = false;
    let message = err.message || String(err);
    if (message.includes('ETIMEDOUT')) {
        message = `Connection Timeout (ETIMEDOUT). This usually means the firewall on ${process.env.DB_HOST || "131.153.147.178"} is blocking Vercel. Please ensure incoming connections from all IPs are allowed.`;
    }
    dbError = message;
    console.error("Database initialization failed:", dbError);
  }
}

// TMDB Proxy
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_TMDB_API_KEY = process.env.TMDB_API_KEY || "2d93ebba01c3a81f04f9c86874d25143";

const tmdbFetch = async (endpoint: string, params: object = {}) => {
  let apiKey = DEFAULT_TMDB_API_KEY;
  
  if (dbReady) {
    const settings = await fetchSettings();
    if (settings['TMDB_API_KEY']) {
        apiKey = settings['TMDB_API_KEY'];
    }
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: apiKey,
          ...params,
        },
        timeout: 15000 // 15 seconds
      });
      return response.data;
  } catch (err: any) {
      const errorMsg = err.response?.data?.status_message || err.message;
      console.error(`TMDB Request Failed (${endpoint}):`, errorMsg);
      if (err.response?.status === 401) {
          throw new Error("TMDB Authentication Failed: Please check your API Key in Admin Settings.");
      }
      throw new Error(`Cinode Fetch Error: ${errorMsg}`);
  }
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: dbReady ? "online" : "degraded",
    dbConnected: dbReady, 
    dbError: dbError || "None"
  });
});

const ensureDB = async (req: any, res: any, next: any) => {
    if (!dbReady) {
        return res.status(503).json({ 
            error: "Database unavailable", 
            details: dbError,
            action: "Contact admin or wait for reconnection"
        });
    }
    next();
};

app.get("/api/movies/trending", async (req, res) => {
  try {
    const data = await tmdbFetch("/trending/all/day");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Trending Movies Error: ${err.message}` });
  }
});

app.get("/api/tv/trending", async (req, res) => {
  try {
    const data = await tmdbFetch("/trending/tv/day");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Trending TV Error: ${err.message}` });
  }
});

app.get("/api/movies/genres", async (req, res) => {
  try {
    const data = await tmdbFetch("/genre/movie/list");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Genres Error: ${err.message}` });
  }
});

app.get("/api/discover", async (req, res) => {
  const { with_genres, region, sort_by } = req.query;
  try {
    const data = await tmdbFetch("/discover/movie", { with_genres, region, sort_by });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Discover Error: ${err.message}` });
  }
});

app.get("/api/movies/details/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  try {
    let data = await tmdbFetch(`/${type}/${id}`, { append_to_response: "credits,videos,recommendations" });
    
    // Merge overrides if they exist
    try {
        if (dbReady) {
            const [rows]: any = await pool.execute(
                'SELECT * FROM media_overrides WHERE tmdb_id = ? AND media_type = ?',
                [String(id), type]
            );
            if (rows.length > 0) {
                const override = rows[0];
                if (override.video_url) {
                    if (!data.videos) data.videos = { results: [] };
                    data.videos.results.unshift({
                    key: override.video_url,
                    name: "Direct Source",
                    site: "Cinode Vault",
                    type: "Override",
                    is_override: true 
                    });
                    data.override_url = override.video_url;
                    data.intro_start = override.intro_start;
                    data.intro_end = override.intro_end;
                }
                if (override.custom_title) data.title = override.custom_title;
                if (override.custom_title) data.name = override.custom_title;
                if (override.custom_overview) data.overview = override.custom_overview;
                data.has_admin_override = true;
            }
        }
    } catch (err: any) {
        console.error("Failed to fetch overrides from DB:", err.message);
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Details Error: ${err.message}` });
  }
});

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  try {
    const data = await tmdbFetch("/search/multi", { query: q });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: `Search Error: ${err.message}` });
  }
});

// Settings & Premium info
app.get("/api/settings/public", async (req, res) => {
    const publicKeys = ['premium_price_monthly', 'payment_info', 'allow_downloads'];
    
    // Fallback defaults
    const fallback = {
        premium_price_monthly: '9.99',
        payment_info: 'Cinode Master Vault: PayPal admin@example.com (Contact admin for bulk)',
        allow_downloads: 'true'
    };

    if (!dbReady) {
        return res.json(fallback);
    }

    try {
        const [rows]: any = await pool.execute(
            'SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?, ?)',
            ['premium_price_monthly', 'payment_info', 'allow_downloads']
        );
        const result: any = { ...fallback };
        rows.forEach((s: any) => {
            result[s.setting_key] = s.setting_value;
        });
        res.json(result);
    } catch (err: any) {
        console.error("Public settings retrieval fail:", err.message);
        res.json(fallback);
    }
});

app.post("/api/user/checkout", ensureDB, async (req, res) => {
    const { email, plan, transaction_id } = req.body;
    try {
        await pool.execute(
            'UPDATE users SET is_premium = 1, premium_since = NOW(), premium_plan = ?, last_transaction_id = ? WHERE email = ?',
            [plan, transaction_id, email]
        );
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Checkout failed: ${err.message}` });
    }
});

// User Routes
app.post("/api/user/login", async (req, res) => {
  const { email } = req.body;
  if (!dbReady) return res.status(503).json({ error: "Database offline" });
  try {
    await pool.execute(
        'INSERT INTO users (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email',
        [email]
    );
    
    // Check for expired subscriptions and update is_premium
    const [subs]: any = await pool.execute('SELECT * FROM subscriptions WHERE user_email = ? AND status = "active"', [email]);
    let isPremium = false;
    for (const sub of subs) {
        if (new Date(sub.expiry_date) < new Date()) {
            await pool.execute('UPDATE subscriptions SET status = "expired" WHERE id = ?', [sub.id]);
        } else {
            isPremium = true;
        }
    }
    await pool.execute('UPDATE users SET is_premium = ? WHERE email = ?', [isPremium ? 1 : 0, email]);

    res.json({ success: true, email });
  } catch (err: any) {
    res.status(500).json({ error: `Login failed: ${err.message}` });
  }
});

app.get("/api/user/me", ensureDB, async (req, res) => {
  const email = req.headers["x-user-email"];
  if (!email || email === "undefined") return res.status(401).json({ error: "Unauthorized" });

  try {
    // Ensure user exists first (case where user has email in localStorage but backend DB was reset)
    await pool.execute(
        'INSERT INTO users (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email',
        [email]
    );

    // Sync subscription status before returning
    const [subs]: any = await pool.execute('SELECT * FROM subscriptions WHERE user_email = ? AND status = "active"', [email]);
    let isPremium = false;
    let latestExpiry = null;
    for (const sub of subs) {
        if (new Date(sub.expiry_date) < new Date()) {
            await pool.execute('UPDATE subscriptions SET status = "expired" WHERE id = ?', [sub.id]);
        } else {
            isPremium = true;
            if (!latestExpiry || new Date(sub.expiry_date) > new Date(latestExpiry)) {
                latestExpiry = sub.expiry_date;
            }
        }
    }
    await pool.execute('UPDATE users SET is_premium = ?, premium_since = ? WHERE email = ?', [isPremium ? 1 : 0, isPremium ? (subs[0].start_date || new Date()) : null, email]);

    const [rows]: any = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    if (rows.length > 0) {
        const user = rows[0];
        
        // Check affiliate status
        const [affs]: any = await pool.execute('SELECT * FROM affiliates WHERE user_email = ? AND is_active = 1', [email]);
        let isAffiliate = affs.length > 0;

        // Auto-bootstrap admin as affiliate if missing
        if (!isAffiliate && (user.is_admin || email === 'contactzerolord@gmail.com' || email === 'earr.music@gmail.com')) {
           const [allAffs]: any = await pool.execute('SELECT id FROM affiliates WHERE user_email = ?', [email]);
           if (allAffs.length === 0) {
              const defaultCode = (email as string).split('@')[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000);
              await pool.execute('INSERT IGNORE INTO affiliates (user_email, referral_code) VALUES (?, ?)', [email, defaultCode]);
              isAffiliate = true;
           } else {
              // Existing record but inactive? Reactivate for admin
              await pool.execute('UPDATE affiliates SET is_active = 1 WHERE user_email = ?', [email]);
              isAffiliate = true;
           }
        }

        res.json({
            ...user,
            is_premium: isPremium,
            is_affiliate: isAffiliate,
            subscription_expiry: latestExpiry
        });
    } else {
        res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
      res.status(500).json({ error: `User fetch failed: ${err.message}` });
  }
});

app.post("/api/user/settings", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    const { settings } = req.body;
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
        await pool.execute('UPDATE users SET settings = ? WHERE email = ?', [JSON.stringify(settings), email]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Payments & Checkout
app.post("/api/checkout/upload-proof", ensureDB, upload.single('proof'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No proof image uploaded" });
    }
    const proof_image_url = `/uploads/${path.basename(req.file.path)}`;
    res.json({ success: true, url: proof_image_url });
});

app.post("/api/checkout/extract-info", ensureDB, async (req, res) => {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: "No image URL provided" });

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

        const ai = new GoogleGenAI({ apiKey });
        
        // We need the physical path to read the file for Gemini
        // image_url starts with /uploads/
        const filename = path.basename(image_url);
        // The upload folder is 'uploads' in cwd
        const filePath = path.join(process.cwd(), 'uploads', filename);

        if (!fsSync.existsSync(filePath)) {
            return res.status(404).json({ error: "Image file not found locally" });
        }

        const imageData = fsSync.readFileSync(filePath);
        const base64Data = imageData.toString('base64');

        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
                        { text: "Extract the transaction reference ID, sender name, and amount from this payment receipt. Return as JSON: { \"reference\": string, \"name\": string, \"amount\": number }. Only return JSON." }
                    ]
                }
            ]
        });

        const text = result.text || "";
        const cleanText = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanText);
        
        res.json(data);
    } catch (err: any) {
        console.error("AI Extraction Error:", err);
        res.status(500).json({ error: `Extraction failed: ${err.message}` });
    }
});

// Serve uploads folder
// This was moved up or handled by the express.static call near ensureUploadsDir
// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get("/api/checkout/config", async (req, res) => {
    const fallback = {
        bank_name: "Cinode Master Bank",
        account_name: "Cinode Administration",
        account_number: "0123456789",
        payment_note: "Transfer exact amount and use your email as description. Crypto: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F (USDT BEP20)",
        crypto_address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        tracking_questions: "[]"
    };

    if (!dbReady) {
        return res.json(fallback);
    }

    try {
        const [rows]: any = await pool.execute('SELECT * FROM payment_config LIMIT 1');
        res.json(rows[0] || fallback);
    } catch (err: any) {
        res.json(fallback);
    }
});

app.post("/api/checkout/submit", ensureDB, async (req, res) => {
    const { user_email, plan, amount, sender_name, transaction_reference, referral_code, tracking_answers, proof_image_url } = req.body;
    const refCode = referral_code?.toString().trim().toUpperCase();
    try {
        const [result]: any = await pool.execute(
            'INSERT INTO payment_submissions (user_email, plan, amount, sender_name, transaction_reference, referral_code, tracking_answers, proof_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_email, plan, amount, sender_name, transaction_reference, refCode || null, JSON.stringify(tracking_answers), proof_image_url]
        );
        
        // If referral code used, link user to affiliate if not already linked
        if (refCode) {
            const [aff]: any = await pool.execute('SELECT id FROM affiliates WHERE referral_code = ? AND is_active = 1', [refCode]);
            if (aff.length > 0) {
                await pool.execute('INSERT IGNORE INTO referrals (affiliate_id, referred_user_email) VALUES (?, ?)', [aff[0].id, user_email]);
            }
        }

        res.json({ success: true, submissionId: result.insertId });
    } catch (err: any) {
        res.status(500).json({ error: `Submission failed: ${err.message}` });
    }
});

app.get("/api/user/payments", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.json([]);
    try {
        const [rows]: any = await pool.execute(
            'SELECT * FROM payment_submissions WHERE user_email = ? ORDER BY created_at DESC',
            [email]
        );
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Fetch payments failed: ${err.message}` });
    }
});

// Affiliates (User side)
app.get("/api/affiliate/dashboard", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.status(401).json({ error: "Unauthorized" });
    try {
        let [affs]: any = await pool.execute('SELECT * FROM affiliates WHERE user_email = ?', [email]);
        
        if (affs.length === 0) {
            // Check if user is admin
            const [users]: any = await pool.execute('SELECT is_admin FROM users WHERE email = ?', [email]);
            if (users.length > 0 && (users[0].is_admin || email === 'contactzerolord@gmail.com')) {
                const defaultCode = (email as string).split('@')[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000);
                await pool.execute('INSERT IGNORE INTO affiliates (user_email, referral_code) VALUES (?, ?)', [email, defaultCode]);
                [affs] = await pool.execute('SELECT * FROM affiliates WHERE user_email = ?', [email]);
            }
        }

        if (affs.length === 0) return res.status(404).json({ error: "Not an affiliate" });
        
        const affiliate = affs[0];
        
        // Stats
        const [referrals]: any = await pool.execute(`
            SELECT r.referred_user_email, r.created_at, u.is_premium
            FROM referrals r
            LEFT JOIN users u ON r.referred_user_email = u.email
            WHERE r.affiliate_id = ?
            ORDER BY r.created_at DESC
        `, [affiliate.id]);

        const [totalRes]: any = await pool.execute('SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_earnings WHERE affiliate_id = ?', [affiliate.id]);
        const total_earnings = Number(totalRes[0]?.total || 0);

        const [pendingRes]: any = await pool.execute('SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_earnings WHERE affiliate_id = ? AND status = "pending"', [affiliate.id]);
        const pending_earnings = Number(pendingRes[0]?.total || 0);

        const [paidRes]: any = await pool.execute('SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_earnings WHERE affiliate_id = ? AND status = "paid"', [affiliate.id]);
        const paid_earnings = Number(paidRes[0]?.total || 0);

        const [earnings]: any = await pool.execute(`
            SELECT e.*, p.amount as total_amount, p.plan 
            FROM affiliate_earnings e
            JOIN payment_submissions p ON e.payment_submission_id = p.id
            WHERE e.affiliate_id = ? 
            ORDER BY e.created_at DESC
        `, [affiliate.id]);

        res.json({
            affiliate,
            stats: {
                total_referrals: referrals.length,
                paid_referrals: referrals.filter((r: any) => r.is_premium).length,
                total_earnings: total_earnings || 0,
                pending_earnings: pending_earnings || 0,
                paid_earnings: paid_earnings || 0
            },
            referrals,
            earnings
        });
    } catch (err: any) {
        res.status(500).json({ error: `Affiliate dashboard fail: ${err.message}` });
    }
});

// Ads (User side)
app.get("/api/ads/active", async (req, res) => {
    if (!dbReady) return res.json([]);
    try {
        const [rows]: any = await pool.execute(`
            SELECT * FROM ads 
            WHERE is_active = 1 
            AND (start_date IS NULL OR start_date <= NOW())
            AND (end_date IS NULL OR end_date >= NOW())
            ORDER BY priority DESC, created_at DESC
        `);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Fetch ads failed: ${err.message}` });
    }
});

app.post("/api/ads/track/:id/:action", async (req, res) => {
    const { id, action } = req.params;
    try {
        if (action === 'impression') {
            await pool.execute('UPDATE ads SET impressions = impressions + 1 WHERE id = ?', [id]);
        } else if (action === 'click') {
            await pool.execute('UPDATE ads SET clicks = clicks + 1 WHERE id = ?', [id]);
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Track failed: ${err.message}` });
    }
});

// Notifications (User side)
app.get("/api/notifications", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.json([]);
    try {
        const [rows]: any = await pool.execute(`
            SELECT n.*, un.is_read, un.id as user_notification_id
            FROM user_notifications un
            JOIN notifications n ON un.notification_id = n.id
            WHERE un.user_email = ?
            ORDER BY n.created_at DESC
        `, [email]);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Fetch notifications failed: ${err.message}` });
    }
});

app.post("/api/notifications/read/:id", ensureDB, async (req, res) => {
    const { id } = req.params;
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.status(401).json({ error: "Unauthorized" });
    try {
        await pool.execute('UPDATE user_notifications SET is_read = 1 WHERE notification_id = ? AND user_email = ?', [id, email]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Mark read failed: ${err.message}` });
    }
});

app.post("/api/notifications/read-all", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.status(401).json({ error: "Unauthorized" });
    try {
        await pool.execute('UPDATE user_notifications SET is_read = 1 WHERE user_email = ?', [email]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Mark all read failed: ${err.message}` });
    }
});

app.get("/api/downloads", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.json([]);
    try {
        const [rows]: any = await pool.execute(
            'SELECT * FROM downloads WHERE user_email = ? ORDER BY created_at DESC',
            [email]
        );
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Fetch downloads failed: ${err.message}` });
    }
});

app.post("/api/downloads", ensureDB, async (req, res) => {
    const { user_email, movie_id, title, poster_path, media_type, local_path } = req.body;
    try {
        // Simple check if user is premium
        const [users]: any = await pool.execute('SELECT is_premium, is_admin FROM users WHERE email = ?', [user_email]);
        const user = users[0];
        if (!user || (!user.is_premium && !user.is_admin)) {
            return res.status(403).json({ error: "Premium subscription required for downloads" });
        }

        await pool.execute(
            'INSERT INTO downloads (user_email, movie_id, title, poster_path, media_type, local_path) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE local_path = VALUES(local_path)',
            [user_email, String(movie_id), title, poster_path, media_type, local_path]
        );
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Add to downloads failed: ${err.message}` });
    }
});

app.delete("/api/downloads/:id", ensureDB, async (req, res) => {
    const { id } = req.params;
    const email = req.headers["x-user-email"];
    try {
        await pool.execute(
            'DELETE FROM downloads WHERE movie_id = ? AND user_email = ?',
            [id, email]
        );
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Remove from downloads failed: ${err.message}` });
    }
});

app.get("/api/watchlist", ensureDB, async (req, res) => {
  const email = req.headers["x-user-email"];
  if (!email || email === "undefined") return res.json([]);
  try {
    const [rows]: any = await pool.execute(
        'SELECT * FROM watchlists WHERE user_email = ? ORDER BY created_at DESC',
        [email]
    );
    res.json(rows);
  } catch (err: any) {
      res.status(500).json({ error: `Fetch watchlist failed: ${err.message}` });
  }
});

app.post("/api/watchlist", ensureDB, async (req, res) => {
  const { user_email, movie_id, title, poster_path, media_type } = req.body;
  try {
    await pool.execute(
        'INSERT INTO watchlists (user_email, movie_id, title, poster_path, media_type) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE created_at = created_at',
        [user_email, String(movie_id), title, poster_path, media_type]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `Add to watchlist failed: ${err.message}` });
  }
});

app.delete("/api/watchlist/:id", ensureDB, async (req, res) => {
    const { id } = req.params;
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.status(401).json({ error: "Unauthorized" });
    try {
      await pool.execute(
          'DELETE FROM watchlists WHERE movie_id = ? AND user_email = ?',
          [id, email]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Remove from watchlist failed: ${err.message}` });
    }
});

app.get("/api/reviews/:type/:id", ensureDB, async (req, res) => {
    const { type, id } = req.params;
    try {
        const [rows]: any = await pool.execute(
            'SELECT * FROM reviews WHERE movie_id = ? AND media_type = ? ORDER BY created_at DESC',
            [id, type]
        );
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Fetch reviews failed: ${err.message}` });
    }
});

app.post("/api/reviews", ensureDB, async (req, res) => {
    const { user_email, movie_id, media_type, rating, comment } = req.body;
    try {
      await pool.execute(
          'INSERT INTO reviews (user_email, movie_id, media_type, rating, comment) VALUES (?, ?, ?, ?, ?)',
          [user_email, String(movie_id), media_type, rating, comment]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Post review failed: ${err.message}` });
    }
});

app.get("/api/user/history", ensureDB, async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email || email === "undefined") return res.json([]);
    try {
        const [rows]: any = await pool.execute(
            'SELECT * FROM history WHERE user_email = ? ORDER BY viewed_at DESC LIMIT 10',
            [email]
        );
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Fetch history failed: ${err.message}` });
    }
});

// Admin Middleware
const adminOnly = async (req: any, res: any, next: any) => {
  const email = req.headers["x-user-email"];
  if (!email || email === "undefined") return res.status(401).json({ error: "Unauthorized" });
  
  try {
      const [rows]: any = await pool.execute('SELECT is_admin FROM users WHERE email = ?', [email]);
      if ((rows.length > 0 && rows[0].is_admin) || email === 'contactzerolord@gmail.com' || email === 'earr.music@gmail.com') {
        next();
      } else {
        res.status(403).json({ error: "Forbidden: Admin access required" });
      }
  } catch (err) {
      res.status(500).json({ error: "Auth check failed" });
  }
};

// Admin Endpoints
app.get("/api/admin/stats", ensureDB, adminOnly, async (req, res) => {
  try {
    const [[{user_count}]]: any = await pool.execute('SELECT COUNT(*) as user_count FROM users');
    const [[{review_count}]]: any = await pool.execute('SELECT COUNT(*) as review_count FROM reviews');
    const [[{override_count}]]: any = await pool.execute('SELECT COUNT(*) as override_count FROM media_overrides');
    const [[{pending_payments}]]: any = await pool.execute('SELECT COUNT(*) as pending_payments FROM payment_submissions WHERE status = "pending"');
    
    res.json({
      users: user_count,
      reviews: review_count,
      overrides: override_count,
      pending_payments: pending_payments
    });
  } catch (err: any) {
    res.status(500).json({ error: `Stats failed: ${err.message}` });
  }
});

// Admin Payments
app.get("/api/admin/payments", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM payment_submissions ORDER BY created_at DESC');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Payments list failed: ${err.message}` });
    }
});

app.post("/api/admin/payments/review", ensureDB, adminOnly, async (req, res) => {
    const { id, status, admin_notes } = req.body;
    try {
        const [subs]: any = await pool.execute('SELECT * FROM payment_submissions WHERE id = ?', [id]);
        if (subs.length === 0) return res.status(404).json({ error: "Submission not found" });
        const submission = subs[0];

        await pool.execute('UPDATE payment_submissions SET status = ?, admin_notes = ? WHERE id = ?', [status, admin_notes, id]);

        if (status === 'approved') {
            const days = submission.plan === 'yearly' ? 365 : 30;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);

            await pool.execute(`
                INSERT INTO subscriptions (user_email, plan, expiry_date) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE plan = VALUES(plan), expiry_date = VALUES(expiry_date), status = 'active'
            `, [submission.user_email, submission.plan, expiryDate]);
            
            await pool.execute('UPDATE users SET is_premium = 1, premium_since = ?, premium_plan = ? WHERE email = ?', [new Date(), submission.plan, submission.user_email]);

            // Track affiliate earning if referral code exists
            const refCode = submission.referral_code?.toString().trim().toUpperCase();
            if (refCode) {
                const [affs]: any = await pool.execute('SELECT id FROM affiliates WHERE referral_code = ?', [refCode]);
                if (affs.length > 0) {
                    const submissionAmount = Number(submission.amount);
                    const earningAmount = Math.floor(submissionAmount * 0.2); // 20% commission
                    
                    // Avoid double earning for same submission if reviewed multiple times
                    const [existingEarn]: any = await pool.execute('SELECT id FROM affiliate_earnings WHERE payment_submission_id = ?', [id]);
                    if (existingEarn.length === 0) {
                        await pool.execute('INSERT INTO affiliate_earnings (affiliate_id, payment_submission_id, amount) VALUES (?, ?, ?)', [affs[0].id, id, earningAmount]);
                    }
                } else {
                    console.log(`Referral code ${refCode} used but no affiliate found.`);
                }
            }

            // Send notification
            const [notif]: any = await pool.execute('INSERT INTO notifications (title, message, type, target_type, target_user_email) VALUES (?, ?, ?, ?, ?)', 
                ['Payment Approved', `Your ${submission.plan} subscription has been activated. Enjoy Cinode Premium!`, 'success', 'user', submission.user_email]);
            await pool.execute('INSERT INTO user_notifications (notification_id, user_email) VALUES (?, ?)', [notif.insertId, submission.user_email]);
        } else if (status === 'rejected') {
            // Send notification
            const [notif]: any = await pool.execute('INSERT INTO notifications (title, message, type, target_type, target_user_email) VALUES (?, ?, ?, ?, ?)', 
                ['Payment Rejected', `Your payment submission was rejected. Reason: ${admin_notes || 'No reason provided'}.`, 'error', 'user', submission.user_email]);
            await pool.execute('INSERT INTO user_notifications (notification_id, user_email) VALUES (?, ?)', [notif.insertId, submission.user_email]);
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Review failed: ${err.message}` });
    }
});

app.get("/api/admin/payment-config", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM payment_config LIMIT 1');
        res.json(rows[0] || {});
    } catch (err: any) {
        res.status(500).json({ error: `Failed to fetch payment config: ${err.message}` });
    }
});

app.post("/api/admin/payment-config", ensureDB, adminOnly, async (req, res) => {
    const { bank_name, account_name, account_number, crypto_address, other_method, payment_note, tracking_questions } = req.body;
    try {
        let questionsJson = "[]";
        try {
            if (typeof tracking_questions === 'string') {
                // Ensure it's valid JSON if string, otherwise store empty array
                JSON.parse(tracking_questions);
                questionsJson = tracking_questions;
            } else if (tracking_questions) {
                questionsJson = JSON.stringify(tracking_questions);
            }
        } catch (e) {
            questionsJson = "[]";
        }

        await pool.execute(`
            INSERT INTO payment_config (id, bank_name, account_name, account_number, crypto_address, other_method, payment_note, tracking_questions)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                bank_name = VALUES(bank_name), account_name = VALUES(account_name), 
                account_number = VALUES(account_number), crypto_address = VALUES(crypto_address), 
                other_method = VALUES(other_method), payment_note = VALUES(payment_note), 
                tracking_questions = VALUES(tracking_questions)
        `, [bank_name, account_name, account_number, crypto_address, other_method, payment_note, questionsJson]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Save config failed: ${err.message}` });
    }
});

// Admin Affiliates
app.get("/api/admin/affiliates", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute(`
            SELECT a.*, 
                (SELECT COUNT(*) FROM referrals r WHERE r.affiliate_id = a.id) as referral_count,
                (SELECT COUNT(*) FROM referrals r JOIN users u ON r.referred_user_email = u.email WHERE r.affiliate_id = a.id AND u.is_premium = 1) as paid_referral_count,
                (SELECT COALESCE(SUM(amount), 0) FROM affiliate_earnings e WHERE e.affiliate_id = a.id) as total_earnings,
                (SELECT COALESCE(SUM(amount), 0) FROM affiliate_earnings e WHERE e.affiliate_id = a.id AND e.status = 'pending') as pending_earnings
            FROM affiliates a
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Affiliates list failed: ${err.message}` });
    }
});

app.post("/api/admin/affiliates", ensureDB, adminOnly, async (req, res) => {
    const { email, referral_code } = req.body;
    const refCode = referral_code?.toString().trim().toUpperCase();
    try {
        await pool.execute('INSERT INTO affiliates (user_email, referral_code) VALUES (?, ?)', [email, refCode]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Create affiliate failed: ${err.message}` });
    }
});

app.post("/api/admin/affiliates/toggle", ensureDB, adminOnly, async (req, res) => {
    const { id, is_active } = req.body;
    try {
        await pool.execute('UPDATE affiliates SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Toggle failed: ${err.message}` });
    }
});

app.get("/api/admin/affiliates/earnings", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute(`
            SELECT e.*, a.user_email as affiliate_email, p.user_email as payer_email, p.plan
            FROM affiliate_earnings e
            JOIN affiliates a ON e.affiliate_id = a.id
            JOIN payment_submissions p ON e.payment_submission_id = p.id
            ORDER BY e.created_at DESC
        `);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Earnings list failed: ${err.message}` });
    }
});

app.post("/api/admin/affiliates/payout", ensureDB, adminOnly, async (req, res) => {
    const { earning_ids } = req.body;
    try {
        if (!Array.isArray(earning_ids) || earning_ids.length === 0) return res.status(400).json({ error: "Invalid IDs" });
        await pool.query('UPDATE affiliate_earnings SET status = "paid" WHERE id IN (?)', [earning_ids]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Payout failed: ${err.message}` });
    }
});

// Admin Ads
app.get("/api/admin/ads", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM ads ORDER BY created_at DESC');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Ads list failed: ${err.message}` });
    }
});

app.post("/api/admin/ads", ensureDB, adminOnly, async (req, res) => {
    const { id, name, type, media_url, html_content, click_url, placement, priority, is_active, start_date, end_date } = req.body;
    try {
        if (id) {
            await pool.execute(`
                UPDATE ads SET name = ?, type = ?, media_url = ?, html_content = ?, click_url = ?, 
                                placement = ?, priority = ?, is_active = ?, start_date = ?, end_date = ? 
                WHERE id = ?
            `, [name, type, media_url, html_content, click_url, placement, priority, is_active ? 1 : 0, start_date || null, end_date || null, id]);
        } else {
            await pool.execute(`
                INSERT INTO ads (name, type, media_url, html_content, click_url, placement, priority, is_active, start_date, end_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [name, type, media_url, html_content, click_url, placement, priority, is_active ? 1 : 0, start_date || null, end_date || null]);
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Save ad failed: ${err.message}` });
    }
});

app.delete("/api/admin/ads/:id", ensureDB, adminOnly, async (req, res) => {
    try {
        await pool.execute('DELETE FROM ads WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Delete ad fail: ${err.message}` });
    }
});

// Admin Notifications
app.get("/api/admin/notifications", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM notifications ORDER BY created_at DESC');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Notifications list failed: ${err.message}` });
    }
});

app.post("/api/admin/notifications", ensureDB, adminOnly, async (req, res) => {
    const { title, message, type, target_type, target_user_email } = req.body;
    try {
        const [result]: any = await pool.execute(
            'INSERT INTO notifications (title, message, type, target_type, target_user_email) VALUES (?, ?, ?, ?, ?)',
            [title, message, type, target_type, target_user_email || null]
        );
        const notificationId = result.insertId;

        if (target_type === 'all') {
            const [users]: any = await pool.execute('SELECT email FROM users');
            for (const user of users) {
                await pool.execute('INSERT INTO user_notifications (notification_id, user_email) VALUES (?, ?)', [notificationId, user.email]);
            }
        } else if (target_type === 'user' && target_user_email) {
            await pool.execute('INSERT INTO user_notifications (notification_id, user_email) VALUES (?, ?)', [notificationId, target_user_email]);
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Send notification failed: ${err.message}` });
    }
});

app.delete("/api/admin/notifications/:id", ensureDB, adminOnly, async (req, res) => {
    try {
        await pool.execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Delete notification fail: ${err.message}` });
    }
});

app.get("/api/admin/users", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute(`
            SELECT u.*, 
            (SELECT expiry_date FROM subscriptions WHERE user_email = u.email ORDER BY expiry_date DESC LIMIT 1) as premium_expiry
            FROM users u 
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Users list failed: ${err.message}` });
    }
});

app.post("/api/admin/users/promote", ensureDB, adminOnly, async (req, res) => {
    const { email, is_admin } = req.body;
    try {
        await pool.execute('UPDATE users SET is_admin = ? WHERE email = ?', [is_admin ? 1 : 0, email]);
        res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Promote failed: ${err.message}` });
    }
});

app.post("/api/admin/users/grant-premium", ensureDB, adminOnly, async (req, res) => {
    const { email, duration } = req.body;
    try {
        let days = 0;
        switch (duration) {
            case '2w': days = 14; break;
            case '1m': days = 30; break;
            case '3m': days = 90; break;
            case '4m': days = 120; break;
            case '5m': days = 150; break;
            case '6m': days = 180; break;
            case '1y': days = 365; break;
            default: return res.status(400).json({ error: "Invalid duration" });
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        await pool.execute('INSERT INTO subscriptions (user_email, plan, expiry_date) VALUES (?, ?, ?)', [email, `admin_grant_${duration}`, expiryDate]);
        await pool.execute('UPDATE users SET is_premium = 1 WHERE email = ?', [email]);

        // Send notification
        const [notif]: any = await pool.execute('INSERT INTO notifications (title, message, type, target_type, target_user_email) VALUES (?, ?, ?, ?, ?)', 
            ['Premium VIP Status', `An administrator has granted you Premium status for ${days} days. Enjoy Cinode VIP!`, 'success', 'user', email]);
        await pool.execute('INSERT INTO user_notifications (notification_id, user_email) VALUES (?, ?)', [notif.insertId, email]);

        res.json({ success: true, expiryDate });
    } catch (err: any) {
        res.status(500).json({ error: `Grant failed: ${err.message}` });
    }
});

app.post("/api/admin/users/revoke-premium", ensureDB, adminOnly, async (req, res) => {
    const { email } = req.body;
    try {
        await pool.execute('UPDATE users SET is_premium = 0, premium_since = NULL, premium_plan = NULL WHERE email = ?', [email]);
        await pool.execute('DELETE FROM subscriptions WHERE user_email = ?', [email]);
        
        // Notify user
        const [notif]: any = await pool.execute('INSERT INTO notifications (title, message, type, target_type, target_user_email) VALUES (?, ?, ?, ?, ?)', 
            ['Subscription Update', `Your Premium VIP status has been discontinued by an administrator.`, 'info', 'user', email]);
        await pool.execute('INSERT INTO user_notifications (notification_id, user_email) VALUES (?, ?)', [notif.insertId, email]);

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: `Revoke failed: ${err.message}` });
    }
});

app.delete("/api/admin/users/:email", ensureDB, adminOnly, async (req, res) => {
    const { email } = req.params;
    try {
      await pool.execute('DELETE FROM users WHERE email = ?', [email]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Delete user failed: ${err.message}` });
    }
});

app.get("/api/admin/settings", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM system_settings');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Settings list failed: ${err.message}` });
    }
});

app.post("/api/admin/settings", ensureDB, adminOnly, async (req, res) => {
    const { key, value } = req.body;
    try {
      await pool.execute(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [key, value]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Save setting failed: ${err.message}` });
    }
});

app.get("/api/admin/overrides", ensureDB, adminOnly, async (req, res) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM media_overrides ORDER BY updated_at DESC');
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: `Overrides list failed: ${err.message}` });
    }
});

app.post("/api/admin/overrides", ensureDB, adminOnly, async (req, res) => {
    const { id, title, tmdb_id, media_type, season_number, episode_number, video_url, intro_start, intro_end, custom_title, custom_overview } = req.body;
    try {
      const s = season_number === '' ? null : (season_number || null);
      const e = episode_number === '' ? null : (episode_number || null);
      
      if (id) {
          await pool.execute(
              'UPDATE media_overrides SET title = ?, tmdb_id = ?, media_type = ?, season_number = ?, episode_number = ?, video_url = ?, intro_start = ?, intro_end = ?, custom_title = ?, custom_overview = ? WHERE id = ?',
              [title, tmdb_id, media_type, s, e, video_url, intro_start || null, intro_end || null, custom_title, custom_overview, id]
          );
      } else {
          await pool.execute(
              'INSERT INTO media_overrides (title, tmdb_id, media_type, season_number, episode_number, video_url, intro_start, intro_end, custom_title, custom_overview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [title, tmdb_id, media_type, s, e, video_url, intro_start || null, intro_end || null, custom_title, custom_overview]
          );
      }
      
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: `Save override failed: ${err.message}` });
    }
});

app.delete("/api/admin/overrides/:id", ensureDB, adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.execute('DELETE FROM media_overrides WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Delete override failed: ${err.message}` });
    }
});

app.post("/api/history", ensureDB, async (req, res) => {
    const { user_email, movie_id, title, poster_path, media_type } = req.body;
    try {
      await pool.execute(
          'INSERT INTO history (user_email, movie_id, title, poster_path, media_type) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP',
          [user_email, String(movie_id), title, poster_path, media_type]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `Update history failed: ${err.message}` });
    }
});

async function startServer() {
  initDB(); // Launch in background

  // Background DB reconnection check if it failed initially
  setInterval(async () => {
    if (!dbReady) {
        console.log("Retrying DB connection...");
        await initDB();
    } else {
        // Just test if it's still alive using a lightweight query
        try {
            await pool.query('SELECT 1');
            dbError = null;
            dbReady = true;
        } catch (err: any) {
            console.error("DB sanity check failed:", err.message);
            // Only mark as down if it's a connection error, not a query error
            if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED' || err.fatal) {
                dbReady = false;
                dbError = err.message;
            }
        }
    }
  }, 15000); // Check every 15s for better responsiveness

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== "test" && import.meta.url === `file://${process.argv[1]}`) {
  startServer();
} else if (process.env.VERCEL) {
    // On Vercel, we need to initialize the DB but not call listen
    initDB();
}
