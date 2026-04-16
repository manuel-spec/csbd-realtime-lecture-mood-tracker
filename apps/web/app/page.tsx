"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type MoodType = "confused" | "bored" | "neutral" | "engaged" | "excited";

const moodOptions: Array<{
  value: MoodType;
  label: string;
  emoji: string;
  tone: string;
}> = [
  {
    value: "confused",
    label: "Confused",
    emoji: "🧩",
    tone: "var(--mood-confused)",
  },
  { value: "bored", label: "Bored", emoji: "🥱", tone: "var(--mood-bored)" },
  {
    value: "neutral",
    label: "Neutral",
    emoji: "🙂",
    tone: "var(--mood-neutral)",
  },
  {
    value: "engaged",
    label: "Engaged",
    emoji: "🤝",
    tone: "var(--mood-engaged)",
  },
  {
    value: "excited",
    label: "Excited",
    emoji: "🚀",
    tone: "var(--mood-excited)",
  },
];

const initialDistribution: Record<MoodType, number> = {
  confused: 4,
  bored: 2,
  neutral: 8,
  engaged: 12,
  excited: 6,
};

const initialIdeas = [
  {
    id: "idea-1",
    content: "Could we get a quick recap of closure examples?",
    author: "Aisha",
    upvotes: 6,
    time: "2m ago",
  },
  {
    id: "idea-2",
    content: "A diagram of the data flow would help a lot.",
    author: "Anonymous",
    upvotes: 4,
    time: "5m ago",
  },
  {
    id: "idea-3",
    content: "Can we slow down during the API demo?",
    author: "Luis",
    upvotes: 3,
    time: "9m ago",
  },
];

const activityFeed = [
  { id: "activity-1", label: "42 students online", tone: "accent" },
  { id: "activity-2", label: "Mood updated 12s ago", tone: "muted" },
  { id: "activity-3", label: "3 new ideas this session", tone: "highlight" },
];

export default function Home() {
  const [distribution, setDistribution] = useState(initialDistribution);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>("engaged");
  const [ideas, setIdeas] = useState(initialIdeas);
  const [ideaText, setIdeaText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const totalVotes = useMemo(
    () => Object.values(distribution).reduce((sum, value) => sum + value, 0),
    [distribution],
  );

  const dominantMood = useMemo(() => {
    return moodOptions.reduce(
      (leader, mood) => {
        const currentValue = distribution[mood.value];
        if (!leader || currentValue > distribution[leader.value]) {
          return mood;
        }
        return leader;
      },
      null as (typeof moodOptions)[number] | null,
    );
  }, [distribution]);

  const handleVote = (mood: MoodType) => {
    setDistribution((prev) => {
      const next = { ...prev };
      if (selectedMood) {
        next[selectedMood] = Math.max(0, next[selectedMood] - 1);
      }
      next[mood] += 1;
      return next;
    });
    setSelectedMood(mood);
  };

  const handleIdeaSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ideaText.trim()) return;

    setIdeas((prev) => [
      {
        id: `idea-${prev.length + 1}`,
        content: ideaText.trim(),
        author: isAnonymous ? "Anonymous" : "You",
        upvotes: 0,
        time: "Just now",
      },
      ...prev,
    ]);
    setIdeaText("");
    setIsAnonymous(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Lecture Mood Tracker</p>
          <h1>Feel the room in real-time.</h1>
          <p className={styles.subhead}>
            Start a lecture, invite students, and watch engagement update
            instantly. Collect mood signals and ideas without interrupting your
            flow.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton}>Create lecture</button>
          <button className={styles.ghostButton}>Join with code</button>
        </div>
      </header>

      <section className={styles.heroGrid}>
        <div className={styles.heroCard}>
          <h2>Live lecture overview</h2>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Active</span>
            <span className={styles.badgeSecondary}>Advanced Web Systems</span>
            <span className={styles.badgeSecondary}>Room 3B</span>
          </div>
          <div className={styles.statsGrid}>
            <div>
              <p className={styles.statLabel}>Participants</p>
              <p className={styles.statValue}>48</p>
            </div>
            <div>
              <p className={styles.statLabel}>Ideas shared</p>
              <p className={styles.statValue}>19</p>
            </div>
            <div>
              <p className={styles.statLabel}>Mood trend</p>
              <p className={styles.statValue}>Rising</p>
            </div>
          </div>
          <div className={styles.activityList}>
            {activityFeed.map((item) => (
              <div key={item.id} className={styles.activityItem}>
                <span className={styles.activityDot} data-tone={item.tone} />
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.heroCardMuted}>
          <h2>How it works</h2>
          <ol className={styles.stepsList}>
            <li>
              <span>1</span>
              <div>
                <h3>Create the lecture</h3>
                <p>Generate a session code and share it with your class.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Collect mood signals</h3>
                <p>
                  Students vote on engagement without interrupting the flow.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Surface ideas</h3>
                <p>Anonymous ideas and feedback land in one organized feed.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className={styles.dashboard}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Current mood pulse</h2>
              <p>One vote per student. Updates broadcast in real time.</p>
            </div>
            <div className={styles.panelBadge}>
              Total votes <strong>{totalVotes}</strong>
            </div>
          </div>
          <div className={styles.moodGrid}>
            {moodOptions.map((mood) => {
              const percentage = totalVotes
                ? Math.round((distribution[mood.value] / totalVotes) * 100)
                : 0;
              return (
                <button
                  key={mood.value}
                  className={styles.moodCard}
                  onClick={() => handleVote(mood.value)}
                  data-active={selectedMood === mood.value}
                  style={{ borderColor: mood.tone }}
                >
                  <div>
                    <p className={styles.moodEmoji}>{mood.emoji}</p>
                    <p className={styles.moodLabel}>{mood.label}</p>
                  </div>
                  <div>
                    <p className={styles.moodValue}>
                      {distribution[mood.value]}
                    </p>
                    <p className={styles.moodPercent}>{percentage}%</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className={styles.dominantMood}>
            <p>Dominant mood</p>
            <span>
              {dominantMood
                ? `${dominantMood.emoji} ${dominantMood.label}`
                : "No votes yet"}
            </span>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Idea board</h2>
              <p>Students can post ideas or questions while you teach.</p>
            </div>
            <button className={styles.secondaryButton}>View all</button>
          </div>
          <form className={styles.ideaForm} onSubmit={handleIdeaSubmit}>
            <textarea
              placeholder="Share a question, idea, or feedback for the instructor..."
              value={ideaText}
              maxLength={500}
              onChange={(event) => setIdeaText(event.target.value)}
            />
            <div className={styles.ideaActions}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                />
                Post anonymously
              </label>
              <div className={styles.ideaMeta}>
                <span>{ideaText.length}/500</span>
                <button className={styles.primaryButton} type="submit">
                  Send idea
                </button>
              </div>
            </div>
          </form>
          <div className={styles.ideaList}>
            {ideas.map((idea) => (
              <div key={idea.id} className={styles.ideaCard}>
                <div>
                  <p>{idea.content}</p>
                  <div className={styles.ideaFooter}>
                    <span>{idea.author}</span>
                    <span>• {idea.time}</span>
                  </div>
                </div>
                <button className={styles.ideaUpvote}>⬆ {idea.upvotes}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.footerGrid}>
        <div className={styles.footerCard}>
          <h3>Instructor controls</h3>
          <p>
            Pause voting, reset the mood, or export session insights in one
            place.
          </p>
          <div className={styles.buttonRow}>
            <button className={styles.secondaryButton}>Pause voting</button>
            <button className={styles.ghostButton}>Export stats</button>
          </div>
        </div>
        <div className={styles.footerCardAccent}>
          <h3>Share lecture code</h3>
          <div className={styles.codeRow}>
            <span>CSBD-241</span>
            <button className={styles.primaryButton}>Copy</button>
          </div>
          <p className={styles.codeHint}>Students join at mood.classroom.app</p>
        </div>
      </section>
    </div>
  );
}
