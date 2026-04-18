import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const PORT = 3001;

const moodOrder = ["confused", "bored", "neutral", "engaged", "excited"];
const defaultDistribution = {
  confused: 4,
  bored: 2,
  neutral: 8,
  engaged: 12,
  excited: 6,
};

const lectures = new Map();
const roomClients = new Map();

const getLecture = (lectureId) => {
  if (!lectures.has(lectureId)) {
    lectures.set(lectureId, {
      lectureId,
      votes: new Map(),
      distribution: { ...defaultDistribution },
      ideas: [
        {
          id: "idea-1",
          content: "Could we get a quick recap of closure examples?",
          author: "Aisha",
          upvotes: 6,
          createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        {
          id: "idea-2",
          content: "A diagram of the data flow would help a lot.",
          author: "Anonymous",
          upvotes: 4,
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: "idea-3",
          content: "Can we slow down during the API demo?",
          author: "Luis",
          upvotes: 3,
          createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        },
      ],
      participants: new Set(),
      lastMoodUpdate: new Date().toISOString(),
    });
  }
  return lectures.get(lectureId);
};

const getDominantMood = (distribution) => {
  return moodOrder.reduce((leader, mood) => {
    if (!leader || distribution[mood] > distribution[leader]) {
      return mood;
    }
    return leader;
  }, null);
};

const getAggregation = (lecture) => {
  const totalVotes = Object.values(lecture.distribution).reduce(
    (sum, value) => sum + value,
    0,
  );
  return {
    distribution: lecture.distribution,
    totalVotes,
    dominantMood: getDominantMood(lecture.distribution),
    lastUpdated: lecture.lastMoodUpdate,
  };
};

const getState = (lecture) => ({
  lectureId: lecture.lectureId,
  participants: lecture.participants.size,
  ideas: lecture.ideas,
  ...getAggregation(lecture),
});

const broadcast = (lectureId, message) => {
  const clients = roomClients.get(lectureId);
  if (!clients) return;
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
};

const applyVote = ({ lectureId, userId, mood }) => {
  const lecture = getLecture(lectureId);
  const previous = lecture.votes.get(userId);
  if (previous) {
    lecture.distribution[previous] = Math.max(
      0,
      lecture.distribution[previous] - 1,
    );
  }
  lecture.distribution[mood] += 1;
  lecture.votes.set(userId, mood);
  lecture.lastMoodUpdate = new Date().toISOString();
  return getAggregation(lecture);
};

const createIdea = ({ lectureId, content, author }) => {
  const lecture = getLecture(lectureId);
  const idea = {
    id: randomUUID(),
    content,
    author,
    upvotes: 0,
    createdAt: new Date().toISOString(),
  };
  lecture.ideas.unshift(idea);
  return idea;
};

const upvoteIdea = ({ lectureId, ideaId }) => {
  const lecture = getLecture(lectureId);
  const idea = lecture.ideas.find((entry) => entry.id === ideaId);
  if (!idea) return null;
  idea.upvotes += 1;
  return idea;
};

const handleJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/state") {
    const lectureId = url.searchParams.get("lectureId") ?? "csbd-241";
    const lecture = getLecture(lectureId);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(getState(lecture)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/vote") {
    const body = await handleJsonBody(req);
    const aggregation = applyVote(body);
    broadcast(body.lectureId, { type: "mood_updated", payload: aggregation });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(aggregation));
    return;
  }

  if (req.method === "POST" && url.pathname === "/idea") {
    const body = await handleJsonBody(req);
    const idea = createIdea(body);
    broadcast(body.lectureId, { type: "idea_created", payload: idea });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(idea));
    return;
  }

  if (req.method === "POST" && url.pathname === "/idea/upvote") {
    const body = await handleJsonBody(req);
    const idea = upvoteIdea(body);
    if (!idea) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Idea not found" }));
      return;
    }
    broadcast(body.lectureId, { type: "idea_upvoted", payload: idea });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(idea));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, request) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  const lectureId = url.searchParams.get("lectureId") ?? "csbd-241";
  const userId = url.searchParams.get("userId") ?? randomUUID();

  const lecture = getLecture(lectureId);
  lecture.participants.add(userId);

  if (!roomClients.has(lectureId)) {
    roomClients.set(lectureId, new Set());
  }
  roomClients.get(lectureId).add(socket);

  socket.send(JSON.stringify({ type: "state", payload: getState(lecture) }));
  broadcast(lectureId, {
    type: "participant_count",
    payload: { participants: lecture.participants.size },
  });

  socket.on("message", (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (message?.type === "mood_vote") {
      const aggregation = applyVote({
        lectureId,
        userId,
        mood: message.payload?.mood,
      });
      broadcast(lectureId, { type: "mood_updated", payload: aggregation });
    }

    if (message?.type === "idea_submit") {
      const idea = createIdea({
        lectureId,
        content: message.payload?.content ?? "",
        author: message.payload?.author ?? "Anonymous",
      });
      broadcast(lectureId, { type: "idea_created", payload: idea });
    }

    if (message?.type === "idea_upvote") {
      const idea = upvoteIdea({
        lectureId,
        ideaId: message.payload?.ideaId,
      });
      if (idea) {
        broadcast(lectureId, { type: "idea_upvoted", payload: idea });
      }
    }
  });

  socket.on("close", () => {
    lecture.participants.delete(userId);
    roomClients.get(lectureId)?.delete(socket);
    broadcast(lectureId, {
      type: "participant_count",
      payload: { participants: lecture.participants.size },
    });
  });
});

server.listen(PORT, () => {
  console.log(`Realtime server listening on :${PORT}`);
});
