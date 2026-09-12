"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock, Users, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookMeetingAction } from "@/actions/meetings";
import { meetingBookingSchema } from "@/lib/validations/shop";
import { IMAGES, MEETING_TIME_SLOTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Step = "calendar" | "time" | "details" | "confirmation" | "done";

/**
 * Multi-step "Book a Meeting" flow — calendar → time slot → details →
 * confirmation — mirroring the original KCS G-Mart booking modal.
 */
export function BookMeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );

  const reset = () => {
    setStep("calendar");
    setSelectedDate(null);
    setTimeSlot(null);
    setErrors({});
    setServerError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async (formData: FormData) => {
    setSubmitting(true);
    setServerError(null);
    setErrors({});

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company: String(formData.get("company") ?? ""),
      date: selectedDate ? toISODate(selectedDate) : "",
      timeSlot: timeSlot ?? "",
      notes: String(formData.get("notes") ?? ""),
    };

    const parsed = meetingBookingSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setSubmitting(false);
      return;
    }

    const result = await bookMeetingAction(null, formData);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.message);
      setErrors(result.fieldErrors ?? {});
      return;
    }

    setStep("done");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Left: branding */}
          <aside className="relative hidden overflow-hidden bg-brand-ink text-white md:block">
            <Image
              src={IMAGES.panIndia}
              alt=""
              fill
              sizes="420px"
              className="object-cover opacity-60"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            <div className="relative flex h-full flex-col p-8">
              <span className="kicker text-brand-amber">Free consultation</span>
              <h3 className="display mt-2.5 text-[1.75rem] text-white">
                Explore unique corporate gifting solutions.
              </h3>
              <p className="mt-3 text-sm text-white/75">
                We help you plan hampers, joining kits and branded merchandise for your team.
              </p>
              <ul className="mt-auto space-y-3 pt-8 text-sm">
                {[
                  { icon: Users, text: "Dedicated gifting manager" },
                  { icon: Video, text: "Video call or on-site meeting" },
                  { icon: CheckCircle2, text: "Free samples and mock-ups" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                      <item.icon className="size-3.5 text-brand-amber" aria-hidden />
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right: steps */}
          <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">
            <DialogHeader className="mb-5 text-left">
              <DialogTitle className="display text-[1.5rem] md:text-[1.75rem]">
                Book a Meeting
              </DialogTitle>
              <DialogDescription>
                Pick a date and time — a gifting expert will confirm by email.
              </DialogDescription>
            </DialogHeader>

            {/* Progress */}
            {step !== "done" && (
              <ol className="mb-6 flex items-center gap-2" aria-label="Booking progress">
                {(["calendar", "time", "details"] as const).map((key, i) => {
                  const order = ["calendar", "time", "details", "confirmation"];
                  const current = order.indexOf(step) >= i;
                  return (
                    <li key={key} className="flex flex-1 items-center gap-2">
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
                          current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className={cn("hidden text-xs font-semibold sm:inline", current ? "text-foreground" : "text-muted-foreground")}>
                        {["Date", "Time", "Details"][i]}
                      </span>
                      {i < 2 && <span className={cn("h-px flex-1", current && order.indexOf(step) > i ? "bg-primary" : "bg-border")} aria-hidden />}
                    </li>
                  );
                })}
              </ol>
            )}
            {/* Step 1 — calendar */}
            {step === "calendar" && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden /> Select a date
                </h3>
                <MiniCalendar
                  monthStart={monthStart}
                  minDate={today}
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setStep("time");
                  }}
                />
              </div>
            )}

            {/* Step 2 — time */}
            {step === "time" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" aria-hidden /> Pick a time
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep("calendar")}>
                    <ChevronLeft className="h-4 w-4 mr-1" aria-hidden /> Back
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedDate?.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="Available time slots">
                  {MEETING_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      role="option"
                      aria-selected={timeSlot === slot}
                      onClick={() => {
                        setTimeSlot(slot);
                        setStep("details");
                      }}
                      className={cn(
                        "rounded-lg border py-2.5 text-sm font-semibold transition-all hover:border-primary hover:bg-primary/[0.05] hover:text-primary",
                        timeSlot === slot && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — details */}
            {step === "details" && (
              <form action={submit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Your details</h3>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setStep("time")}>
                    <ChevronLeft className="h-4 w-4 mr-1" aria-hidden /> Back
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedDate?.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  at {timeSlot}
                </p>

                <div className="grid gap-2">
                  <Label htmlFor="bm-name">Full name *</Label>
                  <Input id="bm-name" name="name" required aria-invalid={Boolean(errors.name)} />
                  <FieldError errors={errors.name} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bm-email">Work email *</Label>
                  <Input id="bm-email" name="email" type="email" required aria-invalid={Boolean(errors.email)} />
                  <FieldError errors={errors.email} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="bm-phone">Phone</Label>
                    <Input id="bm-phone" name="phone" aria-invalid={Boolean(errors.phone)} />
                    <FieldError errors={errors.phone} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bm-company">Company</Label>
                    <Input id="bm-company" name="company" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bm-notes">Anything we should prepare?</Label>
                  <Textarea id="bm-notes" name="notes" rows={3} maxLength={1000} />
                  <FieldError errors={errors.notes} />
                </div>

                {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                <Button type="submit" size="xl" className="w-full" disabled={submitting}>
                  {submitting ? "Booking…" : "Confirm Booking"}
                </Button>
              </form>
            )}

            {/* Step 4 — done */}
            {step === "done" && (
              <div className="space-y-4 py-8 text-center">
                <span className="relative mx-auto grid size-24 place-items-center">
                  <span aria-hidden className="animate-ring absolute inset-0 rounded-full border-2 border-success/40" />
                  <span className="relative grid size-16 place-items-center rounded-full bg-success text-white">
                    <CheckCircle2 className="size-8" aria-hidden />
                  </span>
                </span>
                <h3 className="display text-[1.5rem]">Meeting booked!</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDate?.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  at {timeSlot}. Our team will confirm the details by email shortly.
                </p>
                <Button onClick={() => handleOpenChange(false)}>Done</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function MiniCalendar({
  monthStart,
  minDate,
  selected,
  onSelect,
}: {
  monthStart: Date;
  minDate: Date;
  selected: Date | null;
  onSelect: (date: Date) => void;
}) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayFloor = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/[0.07]">
      <p className="mb-2 text-center text-sm font-bold">
        {monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1" aria-hidden>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} aria-hidden />;
          const disabled = date < todayFloor;
          const isSelected = selected ? sameDay(date, selected) : false;
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-label={date.toLocaleDateString("en-IN", { dateStyle: "full" })}
              aria-pressed={isSelected}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-colors hover:bg-primary/[0.08] hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit",
                sameDay(date, todayFloor) && !isSelected && "ring-1 ring-primary/40",
                isSelected && "bg-primary text-primary-foreground shadow-[0_8px_16px_-8px_var(--primary)] hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
