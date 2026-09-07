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
import { meetingBookingSchema, type MeetingBookingInput } from "@/lib/validations/shop";
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Explore Unique Corporate Gifting Solutions
          </DialogTitle>
          <DialogDescription>
            Book a free consultation with our gifting experts — we help you plan hampers, joining
            kits and branded merchandise for your team.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8 mt-2">
          {/* Left: branding */}
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden h-56 md:h-64">
              <Image
                src={IMAGES.panIndia}
                alt="Corporate gifting consultation"
                fill
                className="object-cover"
              />
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" aria-hidden /> Dedicated gifting
                manager
              </li>
              <li className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary shrink-0" aria-hidden /> Video call or
                on-site meeting
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden /> Free samples
                and mockups
              </li>
            </ul>
          </div>

          {/* Right: steps */}
          <div>
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
                <div className="grid grid-cols-4 gap-2" role="listbox" aria-label="Available time slots">
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
                        "border rounded-md py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors",
                        timeSlot === slot && "border-primary bg-primary/5 text-primary"
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

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Booking…" : "Confirm Booking"}
                </Button>
              </form>
            )}

            {/* Step 4 — done */}
            {step === "done" && (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" aria-hidden />
                <h3 className="text-xl font-bold">Meeting booked!</h3>
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
    <div className="border rounded-lg p-3">
      <p className="text-center font-semibold mb-2">
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
                "h-9 rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary"
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
