import { useState, useEffect, useRef } from "react";

const GOOGLE_CIVIC_API_KEY = "AIzaSyB37hXgp0dcok_9fA-eUh8J8r1TgGcANJY";

const SYSTEM_PROMPT = `You are CivicGuide, a friendly and nonpartisan election education assistant. Your mission is to help users understand the election process, timelines, and steps in a clear, engaging, and accessible way.

You cover topics like:
- Voter registration (eligibility, deadlines, how to register)
- Primary vs general elections
- How to find your polling place
- What happens on Election Day (what to bring, the voting process)
- Mail-in / absentee voting
- Electoral College (for US presidential elections)
- Election results and certification timelines
- Roles of election officials
- Different types of elections (local, state, federal)
- Campaign finance basics
- How ballots are counted and audited

Guidelines:
- Be politically NEUTRAL — never favor any party, candidate, or ideology
- Be encouraging and accessible — make civics feel approachable, not intimidating
- Use simple language, bullet points, and step-by-step explanations when helpful
- When asked about specific locations, explain that rules vary by jurisdiction and suggest they check their local election authority
- For US-focused questions, provide US context by default unless the user specifies otherwise
- Keep responses concise and conversational — avoid walls of text
- If asked about specific candidates or partisan politics, politely redirect to the process itself`;

const QUICK_QUESTIONS = [
  { icon: "🗳️", text: "How do I register to vote?" },
  { icon: "📅", text: "What are election deadlines?" },
  { icon: "🏛️", text: "How does the Electoral College work?" },
  { icon: "📬", text: "How do I vote by mail?" },
  { icon: "📋", text: "What happens on Election Day?" },
  { icon: "🔢", text: "How are votes counted?" },
];

const TIMELINE_STEPS = [
  { phase: "Months Before", icon: "📝", title: "Registration", desc: "Check eligibility & register to vote. Deadlines vary by state — often 15–30 days before election day." },
  { phase: "Weeks Before", icon: "🔍", title: "Research", desc: "Study candidates, ballot measures, and locate your polling place. Request a mail-in ballot if needed." },
  { phase: "Days Before", icon: "✅", title: "Prepare", desc: "Confirm your registration is active, gather required ID, and know your polling location and hours." },
  { phase: "Election Day", icon: "🗳️", title: "Vote", desc: "Go to your polling place, check in, receive your ballot, mark it carefully, and submit. Keep your stub." },
  { phase: "After Voting", icon: "📊", title: "Results", desc: "Votes are counted, verified, and certified. This process can take days to weeks depending on jurisdiction." },
];

const TIPS = [
  { icon: "📝", title: "Register Early", tip: "Don't wait until the last minute. Many states have registration deadlines 15–30 days before an election. Some states allow same-day registration." },
  { icon: "🆔", title: "Know Your ID Requirements", tip: "Voter ID laws vary widely by state. Check your state's requirements in advance — some states are strict, others require no ID at all." },
  { icon: "📍", title: "Find Your Polling Place", tip: "Your polling place may change between elections. Always verify your assigned location before Election Day using your state's official voter portal." },
  { icon: "⏰", title: "Check Polling Hours", tip: "Polls typically open 6–7 AM and close at 7–8 PM, but this varies by state. If you're in line before closing time, you have the right to vote." },
  { icon: "📬", title: "Request Mail Ballots Early", tip: "If voting by mail, request your ballot weeks in advance. Return it early — postmarks may not be enough; it usually must arrive by Election Day." },
  { icon: "🔍", title: "Research Your Full Ballot", tip: "Beyond candidates, ballots include judges, local officials, and ballot measures. Look up your full sample ballot ahead of time." },
  { icon: "📣", title: "Encourage, Don't Pressure", tip: "Encourage others to participate, but respect that voting is personal. Coercing someone's vote is illegal in every state." },
  { icon: "📞", title: "Report Issues", tip: "Encounter problems at the polls? Call the nonpartisan Election Protection Hotline: 1-866-OUR-VOTE (1-866-687-8683)." },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "13px 17px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.14)", borderRadius: "20px 20px 20px 4px", width: "fit-content" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#c9a84c", animation: "dotBounce 1.3s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, animation: "rise 0.35s cubic-bezier(0.22,1,0.36,1)", gap: 10, alignItems: "flex-end" }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #b8940a, #e8c96a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: "0 2px 12px rgba(201,168,76,0.4)", marginBottom: 2 }}>🏛️</div>
      )}
      <div style={{ maxWidth: "72%", padding: "13px 17px", borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: isUser ? "linear-gradient(135deg, #b8940a 0%, #d4a820 50%, #e8c96a 100%)" : "rgba(255,255,255,0.035)", border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", color: isUser ? "#1a1204" : "#ccc8be", fontSize: 13.5, lineHeight: 1.72, fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif", fontWeight: isUser ? 600 : 400, boxShadow: isUser ? "0 6px 24px rgba(184,148,10,0.4)" : "0 2px 14px rgba(0,0,0,0.3)", whiteSpace: "pre-wrap", letterSpacing: "0.01em" }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginBottom: 2 }}>👤</div>
      )}
    </div>
  );
}

function LookupTab() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voterInfo, setVoterInfo] = useState(null);
  const [representatives, setRepresentatives] = useState(null);
  const [activeSection, setActiveSection] = useState("polling");

  const fetchCivicData = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setVoterInfo(null);
    setRepresentatives(null);

    try {
      const [repRes, voterRes] = await Promise.allSettled([
        fetch(`https://civicinfo.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${GOOGLE_CIVIC_API_KEY}`),
        fetch(`https://civicinfo.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(address)}&electionId=2000&key=${GOOGLE_CIVIC_API_KEY}`)
      ]);

      if (repRes.status === "fulfilled" && repRes.value.ok) {
        const data = await repRes.value.json();
        setRepresentatives(data);
      }

      if (voterRes.status === "fulfilled" && voterRes.value.ok) {
        const data = await voterRes.value.json();
        setVoterInfo(data);
      } else if (repRes.status === "rejected" || !repRes.value?.ok) {
        setError("Could not find data for this address. Please try a full US address (e.g. 1600 Pennsylvania Ave NW, Washington DC 20500).");
      }
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasData = voterInfo || representatives;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 24px" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 10.5, letterSpacing: "0.22em", color: "rgba(201,168,76,0.6)", textTransform: "uppercase", marginBottom: 6 }}>Powered by Google Civic Information API</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#e0d4b4", fontWeight: 300, letterSpacing: "-0.01em", marginBottom: 20 }}>Your Civic Lookup</div>

      {/* Address input */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "10px 16px", transition: "border-color 0.2s" }} className="input-wrap">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchCivicData()}
            placeholder="Enter your US address (e.g. 1600 Pennsylvania Ave, DC)"
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.78)", fontSize: 13, fontFamily: "'Palatino Linotype', Palatino, serif" }}
          />
        </div>
        <button
          onClick={fetchCivicData}
          disabled={loading || !address.trim()}
          style={{ padding: "0 20px", borderRadius: 14, border: "none", background: address.trim() && !loading ? "linear-gradient(135deg, #a07810, #c9a84c, #e0be58)" : "rgba(255,255,255,0.06)", color: address.trim() && !loading ? "#1a1204" : "rgba(255,255,255,0.2)", fontSize: 12, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: "0.08em", cursor: address.trim() && !loading ? "pointer" : "not-allowed", transition: "all 0.2s", whiteSpace: "nowrap" }}
        >
          {loading ? "Searching…" : "Look Up ➤"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(220,80,60,0.08)", border: "1px solid rgba(220,80,60,0.2)", borderRadius: 14, padding: "12px 16px", color: "rgba(255,160,140,0.85)", fontSize: 12.5, fontFamily: "'Crimson Text', serif", marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 16 }}>
          <TypingDots />
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'Crimson Text', serif", letterSpacing: "0.06em" }}>Fetching civic data…</div>
        </div>
      )}

      {hasData && !loading && (
        <>
          {/* Section tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { id: "polling", label: "📍 Polling Places", show: !!(voterInfo?.pollingLocations?.length) },
              { id: "election", label: "🗳️ Election Info", show: !!(voterInfo?.election) },
              { id: "officials", label: "🏛️ Representatives", show: !!(representatives?.officials?.length) },
              { id: "contests", label: "📋 Contests", show: !!(voterInfo?.contests?.length) },
            ].filter(s => s.show).map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${activeSection === s.id ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`, background: activeSection === s.id ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)", color: activeSection === s.id ? "#c9a84c" : "rgba(255,255,255,0.45)", fontSize: 11.5, fontFamily: "'Crimson Text', serif", cursor: "pointer", transition: "all 0.2s" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Polling Places */}
          {activeSection === "polling" && voterInfo?.pollingLocations?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {voterInfo.pollingLocations.map((loc, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📍</div>
                    <div style={{ flex: 1 }}>
                      {loc.address?.locationName && (
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: "#e0d4b4", marginBottom: 4 }}>{loc.address.locationName}</div>
                      )}
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", fontFamily: "'Crimson Text', serif", lineHeight: 1.5 }}>
                        {[loc.address?.line1, loc.address?.city, loc.address?.state, loc.address?.zip].filter(Boolean).join(", ")}
                      </div>
                      {loc.pollingHours && (
                        <div style={{ fontSize: 11.5, color: "rgba(201,168,76,0.6)", marginTop: 6, fontFamily: "Georgia, serif", letterSpacing: "0.04em" }}>
                          ⏰ {loc.pollingHours}
                        </div>
                      )}
                      {loc.notes && (
                        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 5, fontFamily: "'Crimson Text', serif", fontStyle: "italic" }}>{loc.notes}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Election Info */}
          {activeSection === "election" && voterInfo?.election && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.2em", color: "rgba(201,168,76,0.55)", textTransform: "uppercase", fontFamily: "Georgia, serif", marginBottom: 8 }}>Upcoming Election</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#e0d4b4", fontWeight: 600, marginBottom: 6 }}>{voterInfo.election.name}</div>
                {voterInfo.election.electionDay && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'Crimson Text', serif" }}>📅 Election Day: {voterInfo.election.electionDay}</div>
                )}
              </div>

              {voterInfo.state?.map((st, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 600, color: "#c9a84c", marginBottom: 10 }}>{st.name} — Voter Information</div>
                  {st.electionAdministrationBody && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {st.electionAdministrationBody.name && (
                        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", fontFamily: "'Crimson Text', serif" }}>🏢 {st.electionAdministrationBody.name}</div>
                      )}
                      {st.electionAdministrationBody.electionInfoUrl && (
                        <a href={st.electionAdministrationBody.electionInfoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#c9a84c", fontFamily: "Georgia, serif", textDecoration: "none", letterSpacing: "0.04em" }}>🔗 Election Info →</a>
                      )}
                      {st.electionAdministrationBody.votingLocationFinderUrl && (
                        <a href={st.electionAdministrationBody.votingLocationFinderUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#c9a84c", fontFamily: "Georgia, serif", textDecoration: "none", letterSpacing: "0.04em" }}>📍 Find Polling Place →</a>
                      )}
                      {st.electionAdministrationBody.ballotInfoUrl && (
                        <a href={st.electionAdministrationBody.ballotInfoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#c9a84c", fontFamily: "Georgia, serif", textDecoration: "none", letterSpacing: "0.04em" }}>📋 Ballot Info →</a>
                      )}
                      {st.electionAdministrationBody.registrationUrl && (
                        <a href={st.electionAdministrationBody.registrationUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#c9a84c", fontFamily: "Georgia, serif", textDecoration: "none", letterSpacing: "0.04em" }}>📝 Register to Vote →</a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Representatives */}
          {activeSection === "officials" && representatives?.officials?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {representatives.divisions && Object.entries(representatives.divisions).slice(0, 1).map(([divId, div]) => (
                <div key={divId} style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Georgia, serif", letterSpacing: "0.06em", marginBottom: 4 }}>
                  {div.name}
                </div>
              ))}
              {representatives.offices?.map((office, oi) => (
                office.officialIndices?.map(idx => {
                  const official = representatives.officials[idx];
                  if (!official) return null;
                  return (
                    <div key={`${oi}-${idx}`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🏛️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: "#e0d4b4", marginBottom: 2 }}>{official.name}</div>
                        <div style={{ fontSize: 11.5, color: "rgba(201,168,76,0.6)", fontFamily: "Georgia, serif", letterSpacing: "0.05em", marginBottom: 6 }}>{office.name}</div>
                        {official.party && (
                          <div style={{ display: "inline-block", fontSize: 10.5, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 10px", fontFamily: "Georgia, serif", marginBottom: 6 }}>{official.party}</div>
                        )}
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {official.urls?.[0] && (
                            <a href={official.urls[0]} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "#c9a84c", fontFamily: "Georgia, serif", textDecoration: "none" }}>🌐 Website →</a>
                          )}
                          {official.phones?.[0] && (
                            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "Georgia, serif" }}>📞 {official.phones[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          )}

          {/* Contests */}
          {activeSection === "contests" && voterInfo?.contests?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {voterInfo.contests.slice(0, 10).map((contest, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 18px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 600, color: "#e0d4b4", marginBottom: 4 }}>{contest.office || contest.referendumTitle || "Contest"}</div>
                  {contest.district?.name && (
                    <div style={{ fontSize: 11, color: "rgba(201,168,76,0.5)", fontFamily: "Georgia, serif", letterSpacing: "0.05em", marginBottom: 8 }}>{contest.district.name}</div>
                  )}
                  {contest.candidates?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {contest.candidates.map((c, ci) => (
                        <div key={ci} style={{ fontSize: 11.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Crimson Text', serif" }}>
                          {c.name}{c.party ? ` (${c.party})` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                  {contest.referendumSubtitle && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Crimson Text', serif", lineHeight: 1.5 }}>{contest.referendumSubtitle}</div>
                  )}
                </div>
              ))}
              {voterInfo.contests.length > 10 && (
                <div style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.25)", fontFamily: "Georgia, serif", padding: "8px 0" }}>+ {voterInfo.contests.length - 10} more contests on your ballot</div>
              )}
            </div>
          )}

          {!voterInfo?.pollingLocations?.length && !voterInfo?.election && !representatives?.officials?.length && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "'Crimson Text', serif" }}>
              No detailed civic data found for this address. Try a full street address including city and state.
            </div>
          )}
        </>
      )}

      {!hasData && !loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 20px", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>🗺️</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>Enter your address above</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.2)", fontFamily: "'Crimson Text', serif", lineHeight: 1.6, maxWidth: 340 }}>
            Look up your polling places, elected representatives, upcoming elections, and ballot contests — all from official Google Civic Information data.
          </div>
        </div>
      )}
    </div>
  );
}

export default function ElectionAssistant() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Welcome. I'm CivicGuide — your nonpartisan companion for understanding the democratic process.\n\nI can walk you through voter registration, Election Day procedures, how ballots are counted, the Electoral College, mail-in voting, and much more.\n\nWhat would you like to understand today?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "I couldn't process that. Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "A connection error occurred. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Palatino Linotype', Palatino, serif", minHeight: "100vh", background: "#0b0b0d", backgroundImage: `radial-gradient(ellipse 90% 55% at 50% -5%, rgba(180,145,50,0.13) 0%, transparent 62%), radial-gradient(ellipse 40% 40% at 85% 85%, rgba(80,60,140,0.07) 0%, transparent 55%)`, display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes rise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        @keyframes dotBounce { 0%,60%,100% { transform: translateY(0); opacity:0.45; } 30% { transform: translateY(-5px); opacity:1; } }
        @keyframes shimmer { 0% { background-position: -300% center; } 100% { background-position: 300% center; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.18); border-radius: 2px; }
        textarea, input { resize: none; font-family: 'Palatino Linotype', Palatino, serif; }
        textarea:focus, input:focus { outline: none; }
        .quick-pill { transition: all 0.22s ease; cursor: pointer; }
        .quick-pill:hover { background: rgba(201,168,76,0.12) !important; border-color: rgba(201,168,76,0.45) !important; color: #d4b050 !important; transform: translateY(-2px); }
        .send-btn { transition: all 0.2s ease; cursor: pointer; }
        .send-btn:hover:not(:disabled) { transform: scale(1.06); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .tab-btn { border: none; cursor: pointer; transition: all 0.2s ease; }
        .tab-btn:hover { color: rgba(201,168,76,0.9) !important; }
        .tip-card { transition: all 0.22s ease; }
        .tip-card:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(201,168,76,0.25) !important; transform: translateX(5px); }
        .input-wrap:focus-within { border-color: rgba(201,168,76,0.38) !important; }
        a:hover { opacity: 0.8; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 690, height: "min(92vh, 820px)", background: "linear-gradient(165deg, #161618 0%, #0e0e10 60%, #0b0b0d 100%)", borderRadius: 30, border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 40px 100px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{ padding: "22px 28px 20px", background: "linear-gradient(180deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.01) 100%)", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ width: 48, height: 48, borderRadius: 15, background: "linear-gradient(145deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.04) 100%)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: "0 4px 20px rgba(201,168,76,0.15)" }}>🏛️</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 23, letterSpacing: "0.06em", lineHeight: 1.1, background: "linear-gradient(90deg, #c8a84c, #f0d878, #c8a84c, #e0be60, #c8a84c)", backgroundSize: "250% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 5s linear infinite" }}>CivicGuide</div>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "rgba(201,168,76,0.5)", textTransform: "uppercase", fontFamily: "Georgia, serif", marginTop: 2 }}>Nonpartisan Election Education</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "6px 13px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", fontFamily: "Georgia, serif" }}>NEUTRAL</span>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, padding: "0 12px" }}>
          {[
            { id: "chat", label: "Conversation", symbol: "◉" },
            { id: "lookup", label: "Civic Lookup", symbol: "◎" },
            { id: "timeline", label: "Timeline", symbol: "◈" },
            { id: "tips", label: "Civic Tips", symbol: "◇" },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "13px 4px 11px", background: "transparent", color: active ? "#c9a84c" : "rgba(255,255,255,0.25)", fontSize: 9.5, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1.5px solid ${active ? "#c9a84c" : "transparent"}`, fontWeight: active ? 600 : 400, marginBottom: -1 }}>
                <span style={{ marginRight: 5, opacity: 0.7 }}>{tab.symbol}</span>{tab.label}
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* CHAT TAB */}
          {activeTab === "chat" && (<>
            <div style={{ padding: "13px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <button key={i} className="quick-pill" onClick={() => sendMessage(q.text)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 30, padding: "6px 13px", color: "rgba(255,255,255,0.45)", fontSize: 11.5, whiteSpace: "nowrap", fontFamily: "'Crimson Text', serif", letterSpacing: "0.025em", flexShrink: 0 }}>
                    <span style={{ marginRight: 5 }}>{q.icon}</span>{q.text}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
              {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
              {loading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #b8940a, #e8c96a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🏛️</div>
                  <TypingDots />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: "13px 18px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.18)", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
              <div className="input-wrap" style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 17, padding: "11px 16px", transition: "border-color 0.2s", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ask about voter registration, Election Day, how ballots are counted…" rows={2} style={{ width: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.78)", fontSize: 13.5, lineHeight: 1.65, letterSpacing: "0.01em", resize: "none" }} />
              </div>
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ width: 46, height: 46, borderRadius: 14, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg, #a07810, #c9a84c, #e0be58)" : "rgba(255,255,255,0.05)", color: input.trim() && !loading ? "#1a1204" : "rgba(255,255,255,0.18)", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: input.trim() && !loading ? "0 4px 20px rgba(180,140,30,0.45)" : "none", flexShrink: 0, fontWeight: 700 }}>➤</button>
            </div>
          </>)}

          {/* LOOKUP TAB */}
          {activeTab === "lookup" && <LookupTab />}

          {/* TIMELINE TAB */}
          {activeTab === "timeline" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px 24px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 10.5, letterSpacing: "0.22em", color: "rgba(201,168,76,0.6)", textTransform: "uppercase", marginBottom: 6 }}>The Path to Your Vote</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "#e0d4b4", fontWeight: 300, letterSpacing: "-0.01em", marginBottom: 30 }}>Election Timeline</div>
              <div style={{ position: "relative", paddingLeft: 22 }}>
                <div style={{ position: "absolute", left: 19, top: 22, bottom: 28, width: 1, background: "linear-gradient(180deg, rgba(201,168,76,0.55) 0%, rgba(201,168,76,0.08) 100%)" }} />
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 20, marginBottom: 22, position: "relative", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1)", animationDelay: `${i * 0.09}s`, animationFillMode: "both", opacity: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(145deg, rgba(201,168,76,0.16), rgba(201,168,76,0.03))", border: "1px solid rgba(201,168,76,0.38)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, zIndex: 1, boxShadow: "0 0 0 5px #0e0e10" }}>{step.icon}</div>
                    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 18, padding: "15px 20px", flex: 1 }}>
                      <div style={{ fontSize: 9.5, letterSpacing: "0.2em", color: "rgba(201,168,76,0.55)", textTransform: "uppercase", fontFamily: "Georgia, serif", marginBottom: 5 }}>{step.phase}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600, color: "#e0d4b4", marginBottom: 7 }}>{step.title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.68, fontFamily: "'Crimson Text', serif" }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIPS TAB */}
          {activeTab === "tips" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px 24px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 10.5, letterSpacing: "0.22em", color: "rgba(201,168,76,0.6)", textTransform: "uppercase", marginBottom: 6 }}>Practical Guidance</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "#e0d4b4", fontWeight: 300, letterSpacing: "-0.01em", marginBottom: 22 }}>Civic Participation Tips</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {TIPS.map((item, i) => (
                  <div key={i} className="tip-card" style={{ display: "flex", gap: 15, padding: "15px 18px", background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 17, animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1)", animationDelay: `${i * 0.06}s`, animationFillMode: "both", opacity: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ paddingTop: 1 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16.5, fontWeight: 600, color: "#e0d4b4", marginBottom: 5 }}>{item.title}</div>
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.68, fontFamily: "'Crimson Text', serif" }}>{item.tip}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: 10.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em", fontFamily: "Georgia, serif", textTransform: "uppercase" }}>
                ⚖️ &nbsp;CivicGuide does not endorse any candidate or party
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
