import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, StatusBadge } from "@/components/common";
import type { BusinessProfile, ProfileField, DataOrigin } from "@/types";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  FileCheck,
  Calendar,
} from "lucide-react";

export function ProfileView() {
  const profile = useAppStore((s) => s.profile);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<ProfileField[]>([]);

  // Calculate completeness percentage
  const totalFields = profile.sections.reduce((acc, s) => acc + s.fields.length, 0);
  const filledFields = profile.sections.reduce(
    (acc, s) => acc + s.fields.filter((f) => f.value.trim().length > 0).length,
    0
  );
  const completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const handleStartEdit = (section: BusinessProfile["sections"][number]) => {
    setEditingSectionId(section.id);
    setEditFields(JSON.parse(JSON.stringify(section.fields)));
  };

  const handleSaveEdit = (sectionId: string) => {
    actions.saveProfileSection(sectionId, editFields);
    setEditingSectionId(null);
  };

  const getOriginBadge = (origin: DataOrigin) => {
    switch (origin) {
      case "user":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
            <Check className="h-2.5 w-2.5" /> User Provided
          </span>
        );
      case "researched":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Sparkles className="h-2.5 w-2.5" /> AI Researched
          </span>
        );
      case "assumption":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
            <HelpCircle className="h-2.5 w-2.5" /> Inferred / Assumption
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Profile & Company Memory"
        description="Structured company facts, target market boundaries, and positioning memory used across autonomous agents."
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>Last Updated: {profile.updatedAt || "Today"}</span>
        </div>
      </PageHeader>

      {/* Completeness & Provenance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border border-border/80 bg-card">
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Knowledge Completeness</span>
            <span className="font-bold text-primary">{completeness}% Verified</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            A comprehensive profile allows the Scout and Writer agents to infer higher quality buying triggers and compose accurate, zero-fluff emails.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center space-y-1.5 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 text-[11px]">
          <span className="font-semibold text-foreground mb-0.5">Data Provenance Legend</span>
          <div className="flex items-center gap-2">{getOriginBadge("user")} <span>Verified human input</span></div>
          <div className="flex items-center gap-2">{getOriginBadge("researched")} <span>Scraped public web facts</span></div>
          <div className="flex items-center gap-2">{getOriginBadge("assumption")} <span>Pending confirmation</span></div>
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profile.sections.map((section) => {
          const isEditing = editingSectionId === section.id;

          return (
            <div
              key={section.id}
              className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {section.title}
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => handleStartEdit(section)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Section
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="p-1 rounded text-muted-foreground hover:bg-muted"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(section.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold"
                    >
                      <Check className="h-3 w-3" /> Save
                    </button>
                  </div>
                )}
              </div>

              {/* Section Fields */}
              <div className="space-y-3.5 text-xs">
                {isEditing ? (
                  <div className="space-y-3">
                    {editFields.map((field, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-medium text-foreground">{field.label}</label>
                          <select
                            value={field.origin}
                            onChange={(e) => {
                              const updated = [...editFields];
                              updated[idx].origin = e.target.value as DataOrigin;
                              setEditFields(updated);
                            }}
                            className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5"
                          >
                            <option value="user">User Provided</option>
                            <option value="researched">AI Researched</option>
                            <option value="assumption">Assumption</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => {
                            const updated = [...editFields];
                            updated[idx].value = e.target.value;
                            setEditFields(updated);
                          }}
                          className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  section.fields.map((field, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 py-1">
                      <div className="space-y-0.5 sm:max-w-[70%]">
                        <span className="text-muted-foreground text-[11px] block">{field.label}</span>
                        <span className="font-medium text-foreground text-xs leading-relaxed block">
                          {field.value || <span className="text-muted-foreground italic">Not specified</span>}
                        </span>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        {getOriginBadge(field.origin)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
