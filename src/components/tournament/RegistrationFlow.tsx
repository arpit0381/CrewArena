"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Tournament, Team, Game } from "@/types/database.types";
import { X, ChevronRight, ChevronLeft, CreditCard, CheckCircle2, ShieldAlert, Award } from "lucide-react";

interface RegistrationFlowProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationFlow({ tournament, isOpen, onClose, onSuccess }: RegistrationFlowProps) {
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !db) return;
    const currentUser = db.getCurrentUser();
    // Get teams captained by the user
    const captainTeams = db.getTeams().filter(t => t.captain_id === currentUser.id);
    setTeams(captainTeams);
    setGames(db.getGames());
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentGame = games.find(g => g.id === tournament.game_id);

  // Validation helper
  const isRosterCompliant = (team: Team) => {
    if (!currentGame) return true;
    // For prototyping, we check if user has created a team for the matching game.
    return team.primary_game === tournament.game_id;
  };

  const getGameName = (gameId: string) => {
    return games.find(g => g.id === gameId)?.name || "Unknown Game";
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!selectedTeamId) {
        setError("Please select a team roster to proceed.");
        return;
      }
      if (currentTeam && !isRosterCompliant(currentTeam)) {
        setError(`Roster game format mismatch. Selected team must play ${currentGame?.name}.`);
        return;
      }
    }
    if (step === 2) {
      // If free, skip payment details step!
      if (tournament.entry_fee === 0) {
        handleSubmitRegistration();
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setStep(prev => prev - 1);
  };

  const handleSubmitRegistration = () => {
    setError("");
    setLoading(true);

    if (tournament.entry_fee > 0 && !utrNumber.trim()) {
      setError("UTR / Transaction ID is required for verification.");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (!db) return;
      db.registerTeam(tournament.id, selectedTeamId, utrNumber.trim(), paymentScreenshot);
      setLoading(false);
      setStep(4);
    }, 1000);
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-border rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,212,255,0.15)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-text-primary">
              Tournament Registry Panel
            </h3>
            <p className="text-[10px] text-text-secondary">
              Registering for {tournament.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-text-primary transition">
            <X size={16} />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="bg-surface px-5 py-3 border-b border-border flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary/70">
          <span className={step >= 1 ? "text-accent" : ""}>1. Roster</span>
          <span className={step >= 2 ? "text-accent" : ""}>2. Rules</span>
          {tournament.entry_fee > 0 && <span className={step >= 3 ? "text-accent" : ""}>3. Payment</span>}
          <span className={step >= 4 ? "text-accent" : ""}>{tournament.entry_fee > 0 ? "4. Review" : "3. Complete"}</span>
        </div>

        {/* Body content */}
        <div className="p-6 flex-1 overflow-y-auto min-h-[260px] max-h-[400px]">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold mb-4">
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: Select Team */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Select Roster Team</h4>
                <p className="text-[10px] text-text-secondary">Select an active squad you command matching the tournament format ({currentGame?.name}).</p>
              </div>

              {teams.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-text-secondary">You don&apos;t captain any teams yet.</p>
                  <a href="/team" className="text-xs text-accent font-bold mt-2 hover:underline inline-block">
                    Create Team first →
                  </a>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {teams.map(team => {
                    const compliant = isRosterCompliant(team);
                    return (
                      <button
                        key={team.id}
                        onClick={() => compliant && setSelectedTeamId(team.id)}
                        disabled={!compliant}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          !compliant
                            ? "opacity-40 bg-transparent border-border/40 cursor-not-allowed"
                            : selectedTeamId === team.id
                            ? "bg-accent/10 border-accent text-accent"
                            : "bg-surface border-border hover:border-border/80 text-text-primary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* logo */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/80 flex items-center justify-center p-1 bg-background">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={team.logo_url || ""} alt="" className="w-full h-full" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-primary">{team.name}</span>
                            <span className="text-[9px] text-text-secondary uppercase">Primary Game: {getGameName(team.primary_game || "")}</span>
                          </div>
                        </div>
                        {compliant ? (
                          <span className="text-[9px] bg-accent/20 text-accent font-mono font-bold px-1.5 py-0.5 rounded">
                            COMPLIANT
                          </span>
                        ) : (
                          <span className="text-[9px] bg-red-500/10 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert size={10} /> MISMATCH
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Rules & Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Tournament Entry Review</h4>
                <p className="text-[10px] text-text-secondary">Please review rules compliance and fee structures before submission.</p>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                  <span className="text-text-secondary">Entry Fee:</span>
                  <span className="font-mono font-bold text-accent">{tournament.entry_fee === 0 ? "FREE" : `₹${tournament.entry_fee}`}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                  <span className="text-text-secondary">Roster Size:</span>
                  <span className="font-bold text-text-primary">{currentGame?.id === "g-valorant" ? 5 : 4} Players</span>
                </div>
                <div>
                  <span className="text-text-secondary block mb-1">Regulations:</span>
                  <p className="text-[10px] text-text-secondary whitespace-pre-line leading-relaxed">
                    {tournament.rules || "Standard regulations apply. Check details page."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment details */}
          {step === 3 && tournament.entry_fee > 0 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Submit Entry Payment</h4>
                <p className="text-[10px] text-text-secondary">Transfer the entry fee using the QR code below and provide the transaction details.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-surface border border-border p-4 rounded-xl">
                <div className="w-28 h-28 bg-white p-1 rounded-lg border border-border shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300" alt="UPI QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-text-secondary uppercase block">UPI Payment Address</span>
                  <span className="text-xs font-mono font-bold text-accent select-all block bg-black/60 px-2 py-1 rounded border border-border/60">
                    crewarena@upi
                  </span>
                  <p className="text-[9px] text-text-secondary/70 leading-relaxed">
                    Upload a receipt screenshot and copy your UTR number (Unique Transaction Reference) below.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">UTR / UPI Transaction ID</label>
                  <input
                    type="text"
                    required
                    placeholder="12-digit transaction number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success confirmation */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 size={44} className="text-green-400 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-text-primary uppercase tracking-wide">Registration Submitted</h4>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  {tournament.entry_fee === 0
                    ? "Your entry is approved! Your squad is listed on the tournament boards."
                    : "Your UPI payment is sent for approval. Admins will review the screenshot/UTR reference shortly."}
                </p>
              </div>

              <div className="bg-surface border border-border/80 rounded-xl p-3.5 max-w-sm mx-auto text-left text-[11px] space-y-1">
                <p><span className="text-text-secondary">Tournament:</span> <strong className="text-text-primary">{tournament.name}</strong></p>
                <p><span className="text-text-secondary">Roster Squad:</span> <strong className="text-text-primary">{currentTeam?.name}</strong></p>
                <p>
                  <span className="text-text-secondary">Status:</span>{" "}
                  <strong className="text-yellow-400">
                    {tournament.entry_fee === 0 ? "Approved" : "Pending Verification"}
                  </strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-900 border-t border-border flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary font-semibold py-2 px-3 hover:bg-white/5 rounded-lg transition"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 || (step === 2 && tournament.entry_fee === 0) ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1 bg-accent hover:bg-accent-hover text-black font-bold uppercase py-2 px-4 rounded-lg text-xs transition cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : step === 3 && tournament.entry_fee > 0 ? (
            <button
              onClick={handleSubmitRegistration}
              disabled={loading}
              className="bg-accent hover:bg-accent-hover text-black font-bold uppercase py-2 px-4 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>File Registration</span>
                  <Award size={14} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-accent hover:bg-accent-hover text-black font-bold uppercase py-2 px-6 rounded-lg text-xs transition cursor-pointer"
            >
              Close Panel
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
