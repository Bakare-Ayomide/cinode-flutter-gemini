import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// JSON Database Setup
const DB_PATH = path.join(process.cwd(), "database.json");

interface DbSchema {
    users: any[];
    system_settings: any[];
    media_overrides: any[];
    watchlists: any[];
    reviews: any[];
    history: any[];
}

let dbData: DbSchema = {
    users: [],
    system_settings: [],
    media_overrides: [],
    watchlists: [],
    reviews: [],
    history: []
};

let dbReady = false;
let dbError: string | null = null;

async function initDB() {
  try {
    try {
        const data = await fs.readFile(DB_PATH, "utf8");
        dbData = JSON.parse(data);
    } catch (err) {
        // File doesn't exist or is invalid, use default and save
        await fs.writeFile(DB_PATH, JSON.stringify(dbData, null, 2));
    }

    // Bootstrap initial admins
    const admins = ['contactzerolord@gmail.com', 'earr.music@gmail.com'];
    for (const adminEmail of admins) {
        const existing = dbData.users.find(u => u.email === adminEmail);
        if (existing) {
            existing.is_admin = 1;
        } else {
            dbData.users.push({
                email: adminEmail,
                is_admin: 1,
                created_at: new Date().toISOString()
            });
        }
    }
    await saveDb();

    dbReady = true;
    dbError = null;
    console.log("JSON Database initialized successfully");
  } catch (err: any) {
    dbReady = false;
    dbError = err.message || String(err);
    console.error("Database initialization failed.", err);
  }
}

async function saveDb() {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(dbData, null, 2));
    } catch (err) {
        console.error("Failed to save DB:", err);
    }
}

// TMDB Proxy
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_TMDB_API_KEY = process.env.TMDB_API_KEY || "2d93ebba01c3a81f04f9c86874d25143";

const tmdbFetch = async (endpoint: string, params: object = {}) => {
  let apiKey = DEFAULT_TMDB_API_KEY;
  
  const setting = dbData.system_settings.find(s => s.setting_key === 'TMDB_API_KEY');
  if (setting && setting.setting_value) {
    apiKey = setting.setting_value;
  }

  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    params: {
      api_key: apiKey,
      ...params,
    },
  });
  return response.data;
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ dbConnected: dbReady, error: dbError });
});

app.get("/api/movies/trending", async (req, res) => {
  try {
    const data = await tmdbFetch("/trending/all/day");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

app.get("/api/tv/trending", async (req, res) => {
  try {
    const data = await tmdbFetch("/trending/tv/day");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tv trending" });
  }
});

app.get("/api/movies/genres", async (req, res) => {
  try {
    const data = await tmdbFetch("/genre/movie/list");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch genres" });
  }
});

app.get("/api/discover", async (req, res) => {
  const { with_genres, region, sort_by } = req.query;
  try {
    const data = await tmdbFetch("/discover/movie", { with_genres, region, sort_by });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Discover failed" });
  }
});

app.get("/api/movies/details/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  try {
    let data = await tmdbFetch(`/${type}/${id}`, { append_to_response: "credits,videos,recommendations" });
    
    // Merge overrides if they exist
    const override = dbData.media_overrides.find(o => String(o.tmdb_id) === String(id) && o.media_type === type);
    if (override) {
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
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch details" });
  }
});

app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  try {
    const data = await tmdbFetch("/search/multi", { query: q });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Settings & Premium info
app.get("/api/settings/public", async (req, res) => {
    const publicKeys = ['premium_price_monthly', 'payment_info', 'allow_downloads'];
    const settings = dbData.system_settings.filter(s => publicKeys.includes(s.setting_key));
    const result: any = {};
    settings.forEach(s => {
        result[s.setting_key] = s.setting_value;
    });
    res.json(result);
});

app.post("/api/user/checkout", async (req, res) => {
    const { email, plan, transaction_id } = req.body;
    try {
        const user = dbData.users.find(u => u.email === email);
        if (user) {
            user.is_premium = true;
            user.premium_since = new Date().toISOString();
            user.premium_plan = plan;
            user.last_transaction_id = transaction_id;
            await saveDb();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Checkout failed" });
    }
});

// User Routes
app.post("/api/user/login", async (req, res) => {
  const { email } = req.body;
  try {
    const existing = dbData.users.find(u => u.email === email);
    if (!existing) {
        dbData.users.push({
            email,
            is_admin: 0,
            created_at: new Date().toISOString()
        });
        await saveDb();
    }
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/user/me", async (req, res) => {
  const email = req.headers["x-user-email"];
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const user = dbData.users.find(u => u.email === email);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.get("/api/watchlist", async (req, res) => {
  const email = req.headers["x-user-email"];
  const list = dbData.watchlists.filter(w => w.user_email === email).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(list);
});

app.post("/api/watchlist", async (req, res) => {
  const { user_email, movie_id, title, poster_path, media_type } = req.body;
  try {
    dbData.watchlists.push({
        id: Date.now(),
        user_email,
        movie_id,
        title,
        poster_path,
        media_type,
        created_at: new Date().toISOString()
    });
    await saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

app.delete("/api/watchlist/:id", async (req, res) => {
    const { id } = req.params;
    const email = req.headers["x-user-email"];
    try {
      dbData.watchlists = dbData.watchlists.filter(w => !(String(w.movie_id) === String(id) && w.user_email === email));
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
});

app.get("/api/reviews/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const history = dbData.reviews.filter(r => String(r.movie_id) === String(id) && r.media_type === type).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(history);
});

app.post("/api/reviews", async (req, res) => {
    const { user_email, movie_id, media_type, rating, comment } = req.body;
    try {
      dbData.reviews.push({
          id: Date.now(),
          user_email,
          movie_id,
          media_type,
          rating,
          comment,
          created_at: new Date().toISOString()
      });
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to post review" });
    }
});

// User History endpoint for frontend recommendations
app.get("/api/user/history", async (req, res) => {
    const email = req.headers["x-user-email"];
    if (!email) return res.status(401).json({ error: "Unauthorized" });
    const history = dbData.history
        .filter(h => h.user_email === email)
        .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
        .slice(0, 10);
    res.json(history);
});

// Admin Middleware
const adminOnly = async (req: any, res: any, next: any) => {
  const email = req.headers["x-user-email"];
  if (!email) return res.status(401).json({ error: "Unauthorized" });
  
  const user = dbData.users.find(u => u.email === email);
  if (user && user.is_admin) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Admin access required" });
  }
};

// Admin Endpoints
app.get("/api/admin/stats", adminOnly, async (req, res) => {
  try {
    res.json({
      users: dbData.users.length,
      reviews: dbData.reviews.length,
      overrides: dbData.media_overrides.length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/admin/users", adminOnly, async (req, res) => {
    const list = [...dbData.users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(list);
});

app.post("/api/admin/users/promote", adminOnly, async (req, res) => {
    const { email, is_admin } = req.body;
    try {
        const user = dbData.users.find(u => u.email === email);
        if (user) {
            user.is_admin = is_admin ? 1 : 0;
            await saveDb();
        }
        res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update user" });
    }
});

app.delete("/api/admin/users/:email", adminOnly, async (req, res) => {
    const { email } = req.params;
    try {
      dbData.users = dbData.users.filter(u => u.email !== email);
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete user" });
    }
});

app.get("/api/admin/settings", adminOnly, async (req, res) => {
    res.json(dbData.system_settings);
});

app.post("/api/admin/settings", adminOnly, async (req, res) => {
    const { key, value } = req.body;
    try {
      const existing = dbData.system_settings.find(s => s.setting_key === key);
      if (existing) {
          existing.setting_value = value;
          existing.updated_at = new Date().toISOString();
      } else {
          dbData.system_settings.push({
              setting_key: key,
              setting_value: value,
              updated_at: new Date().toISOString()
          });
      }
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save setting" });
    }
});

app.get("/api/admin/overrides", adminOnly, async (req, res) => {
    const list = [...dbData.media_overrides].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    res.json(list);
});

app.post("/api/admin/overrides", adminOnly, async (req, res) => {
    const { tmdb_id, media_type, season_number, episode_number, video_url, intro_start, intro_end, custom_title, custom_overview } = req.body;
    try {
      const s = season_number === '' ? null : (season_number || null);
      const e = episode_number === '' ? null : (episode_number || null);
      
      const existingIndex = dbData.media_overrides.findIndex(o => 
        String(o.tmdb_id) === String(tmdb_id) && 
        o.media_type === media_type && 
        String(o.season_number) === String(s) && 
        String(o.episode_number) === String(e)
      );

      const override = {
          tmdb_id,
          media_type,
          season_number: s,
          episode_number: e,
          video_url,
          intro_start: intro_start || null,
          intro_end: intro_end || null,
          custom_title,
          custom_overview,
          updated_at: new Date().toISOString()
      };

      if (existingIndex > -1) {
          dbData.media_overrides[existingIndex] = { ...dbData.media_overrides[existingIndex], ...override };
      } else {
          dbData.media_overrides.push({ ...override, id: Date.now(), created_at: new Date().toISOString() });
      }
      
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save override" });
    }
});

app.delete("/api/admin/overrides/:id", adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
      dbData.media_overrides = dbData.media_overrides.filter(o => String(o.id) !== String(id));
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete override" });
    }
});

app.post("/api/history", async (req, res) => {
    const { user_email, movie_id, title, poster_path, media_type } = req.body;
    try {
      dbData.history.push({
          id: Date.now(),
          user_email,
          movie_id,
          title,
          poster_path,
          media_type,
          viewed_at: new Date().toISOString()
      });
      // Keep only last 50 items per user
      const userHistory = dbData.history.filter(h => h.user_email === user_email);
      if (userHistory.length > 50) {
          const oldestAllowed = userHistory.sort((a,b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())[49];
          dbData.history = dbData.history.filter(h => h.user_email !== user_email || new Date(h.viewed_at).getTime() >= new Date(oldestAllowed.viewed_at).getTime());
      }
      await saveDb();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update history" });
    }
});

async function startServer() {
  await initDB();

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

startServer();
