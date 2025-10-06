import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as homeInfoController from './controllers/homeInfo.controller.js';
import * as categoryController from './controllers/category.controller.js';
import * as topTenController from './controllers/topten.controller.js';
import * as animeInfoController from './controllers/animeInfo.controller.js';
import * as streamController from './controllers/streamInfo.controller.js';
import * as searchController from './controllers/search.controller.js';
import * as episodeListController from './controllers/episodeList.controller.js';
import * as suggestionsController from './controllers/suggestion.controller.js';
import * as scheduleController from './controllers/schedule.controller.js';
import * as serversController from './controllers/servers.controller.js';
import * as randomController from './controllers/random.controller.js';
import * as qtipController from './controllers/qtip.controller.js';
import * as randomIdController from './controllers/randomId.controller.js';
import * as producerController from './controllers/producer.controller.js';
import * as characterListController from './controllers/voiceactor.controller.js';
import * as nextEpisodeScheduleController from './controllers/nextEpisodeSchedule.controller.js';
import { routeTypes } from './routes/category.route.js';
import { getWatchlist } from './controllers/watchlist.controller.js';
import getVoiceActors from './controllers/actors.controller.js';
import getCharacter from './controllers/characters.controller.js';
import * as filterController from './controllers/filter.controller.js';
import getTopSearch from './controllers/topsearch.controller.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET'],
}));

// Helper to convert Hono context to Express-like req object
const createReq = (c) => ({
  query: c.req.query(),
  params: c.req.param(),
  headers: c.req.header(),
});

// Helper to convert Hono context to Express-like res object
const createRes = (c) => ({
  status: (code) => ({ json: (data) => c.json(data, code) }),
  json: (data) => c.json(data),
});

const jsonResponse = (c, data, status = 200) =>
  c.json({ success: true, results: data }, status);

const jsonError = (c, message = "Internal server error", status = 500) =>
  c.json({ success: false, message }, status);

// Create route handler
const createRoute = (path, controllerMethod) => {
  app.get(path, async (c) => {
    try {
      const req = createReq(c);
      const res = createRes(c);
      const data = await controllerMethod(req, res);
      if (!c.res.headers.get('content-type')) {
        return jsonResponse(c, data);
      }
    } catch (err) {
      console.error(`Error in route ${path}:`, err);
      if (!c.res.headers.get('content-type')) {
        return jsonError(c, err.message || "Internal server error");
      }
    }
  });
};

// Home routes
['/api', '/api/'].forEach((route) => {
  app.get(route, async (c) => {
    try {
      const req = createReq(c);
      const res = createRes(c);
      const data = await homeInfoController.getHomeInfo(req, res);
      if (!c.res.headers.get('content-type')) {
        return jsonResponse(c, data);
      }
    } catch (err) {
      console.error("Error in home route:", err);
      if (!c.res.headers.get('content-type')) {
        return jsonError(c, err.message || "Internal server error");
      }
    }
  });
});

// Category routes
routeTypes.forEach((routeType) =>
  createRoute(`/api/${routeType}`, (req, res) =>
    categoryController.getCategory(req, res, routeType)
  )
);

// Other routes
createRoute("/api/top-ten", topTenController.getTopTen);
createRoute("/api/info", animeInfoController.getAnimeInfo);
createRoute("/api/episodes/:id", episodeListController.getEpisodes);
createRoute("/api/servers/:id", serversController.getServers);
createRoute("/api/stream", (req, res) => streamController.getStreamInfo(req, res, false));
createRoute("/api/stream/fallback", (req, res) => streamController.getStreamInfo(req, res, true));
createRoute("/api/search", searchController.search);
createRoute("/api/filter", filterController.filter);
createRoute("/api/search/suggest", suggestionsController.getSuggestions);
createRoute("/api/schedule", scheduleController.getSchedule);
createRoute("/api/schedule/:id", nextEpisodeScheduleController.getNextEpisodeSchedule);
createRoute("/api/random", randomController.getRandom);
createRoute("/api/random/id", randomIdController.getRandomId);
createRoute("/api/qtip/:id", qtipController.getQtip);
createRoute("/api/producer/:id", producerController.getProducer);
createRoute("/api/character/list/:id", characterListController.getVoiceActors);
createRoute("/api/watchlist/:userId/:page?", getWatchlist);
createRoute("/api/actors/:id", getVoiceActors);
createRoute("/api/character/:id", getCharacter);
createRoute("/api/top-search", getTopSearch);

// Catch-all for static files or 404
app.get('*', (c) => {
  return c.json({ success: false, message: "Not found" }, 404);
});

export default app;
