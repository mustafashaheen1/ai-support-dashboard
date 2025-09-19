"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Add the Ticket interface
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

interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: string;
}

interface DailyTicket {
  date: string;
  count: number;
}

export default function Analytics() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    sentimentBreakdown: [] as ChartDataPoint[],
    dailyTickets: [] as DailyTicket[],
    categoryBreakdown: [] as ChartDataPoint[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all tickets
      const ticketsSnapshot = await getDocs(collection(db, "tickets"));
      const tickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        customer: doc.data().customer || "Unknown",
        subject: doc.data().subject || "No Subject",
        status: doc.data().status || "new",
        priority: doc.data().priority || "medium",
        sentiment: doc.data().sentiment || "neutral",
        timestamp: doc.data().timestamp || new Date().toISOString(),
        message: doc.data().message || "",
        category: doc.data().category,
        suggestedResponse: doc.data().suggestedResponse,
      }));

      // Calculate stats
      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(
        (t) => t.status === "resolved"
      ).length;

      // Sentiment breakdown
      const sentimentCounts = {
        positive: tickets.filter((t) => t.sentiment === "positive").length,
        neutral: tickets.filter((t) => t.sentiment === "neutral").length,
        negative: tickets.filter((t) => t.sentiment === "negative").length,
      };

      const sentimentBreakdown = Object.entries(sentimentCounts).map(
        ([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: value,
          percentage:
            totalTickets > 0 ? ((value / totalTickets) * 100).toFixed(1) : "0",
        })
      );

      // Daily tickets (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();

      const dailyTickets = last7Days.map((date) => ({
        date: new Date(date).toLocaleDateString("en", { weekday: "short" }),
        count: tickets.filter(
          (t) => t.timestamp && t.timestamp.startsWith(date)
        ).length,
      }));

      // Category breakdown
      const categories = tickets.reduce((acc, ticket) => {
        const category = ticket.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categoryBreakdown = Object.entries(categories).map(
        ([name, value]) => ({
          name,
          value,
          percentage: "",
        })
      );

      setStats({
        totalTickets,
        resolvedTickets,
        avgResolutionTime: 2.5, // Calculate this properly based on your data
        sentimentBreakdown,
        dailyTickets,
        categoryBreakdown,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const COLORS = {
    positive: "#10b981",
    neutral: "#f59e0b",
    negative: "#ef4444",
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Support Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTickets > 0
                ? ((stats.resolvedTickets / stats.totalTickets) * 100).toFixed(
                    1
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.resolvedTickets} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.sentimentBreakdown.find((s) => s.name === "Positive")
                ?.percentage || 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Positive sentiment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.sentimentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.sentimentBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[
                          entry.name.toLowerCase() as keyof typeof COLORS
                        ] || "#8884d8"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Tickets Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Ticket Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyTickets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
