"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
// ... any other imports

export function GroupsHeader({ heading, text }) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Enter a name and optional description.</DialogDescription>
          </DialogHeader>
          <input placeholder="Group name" className="border p-2 mb-2 w-full" />
          <input placeholder="Description (optional)" className="border p-2 mb-2 w-full" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
