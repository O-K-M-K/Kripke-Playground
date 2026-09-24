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

const lessons = [
  { label: "What is this?", value: "whatisthis.md" },
  { label: "How it works", value: "explainer.md" },
  { label: "How it was built", value: "howthiswasbuilt.md"},
  { label: "Lesson 1", value: "lesson1.md" },
  { label: "Lesson 2", value: "lesson2.md"}
] as const

type LessonValue = (typeof lessons)[number]["value"]

export function RightSidebar() {
  const [currentLesson, setCurrentLesson] = useState<LessonValue>("whatisthis.md")

  return (
    <div className="flex h-full flex-col gap-3 border-l border-sidebar-border p-4 text-sidebar-foreground">
        <Select
          items={lessons}
          value={currentLesson}
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
