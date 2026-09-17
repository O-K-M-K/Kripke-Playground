import { useState } from "react"
import { RichText } from "@/components/rich-text"
import { readContent } from "@/lib/content"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Single source of truth for the navigation. `as const` freezes each `value` to
// a string literal so we can derive a union type from the array itself rather
// than hand-maintaining a parallel type.
const lessons = [
  { label: "What is this?", value: "whatisthis.md" },
  { label: "How it works", value: "explainer.md" },
  { label: "How it was built", value: "howthiswasbuilt.md"},
  { label: "Lesson 1", value: "lesson1.md" },
] as const

// "whatisthis.txt" | "explainer.txt" | "lesson1.txt". The state, the <Select>,
// and the change handler all speak this one type, so a typo won't compile.
type LessonValue = (typeof lessons)[number]["value"]

export function RightSidebar() {
  const [currentLesson, setCurrentLesson] = useState<LessonValue>("whatisthis.md")

  return (
    <div className="flex h-full flex-col gap-3 border-l border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
        <Select
          items={lessons}
          value={currentLesson}
          // Base UI types the value as `LessonValue | null`; the guard both
          // narrows away the null and satisfies the setter.
          onValueChange={(value) => value && setCurrentLesson(value)}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Navigation" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {lessons.map((lesson) => (
                <SelectItem key={lesson.value} value={lesson.value}>
                  {lesson.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          <RichText>{readContent(currentLesson)}</RichText>
        </div>
    </div>
  )
}
