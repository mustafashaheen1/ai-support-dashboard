"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Ticket {
  id: string;
  customer: string;
  subject: string;
  status: "new" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
  message: string;
  category?: string;
  suggestedResponse?: string;
}

export default function SearchBar({
  onResults,
}: {
  onResults: (results: Ticket[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.length < 2) {
      onResults([]);
      return;
    }

    try {
      // Search in multiple fields
      const searchLower = term.toLowerCase();
      const ticketsRef = collection(db, "tickets");
      const snapshot = await getDocs(ticketsRef);

      const results = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Ticket)
        )
        .filter(
          (ticket) =>
            ticket.customer?.toLowerCase().includes(searchLower) ||
            ticket.subject?.toLowerCase().includes(searchLower) ||
            ticket.message?.toLowerCase().includes(searchLower) ||
            ticket.category?.toLowerCase().includes(searchLower)
        );

      onResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="search"
        placeholder="Search tickets by customer, subject, or message..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
