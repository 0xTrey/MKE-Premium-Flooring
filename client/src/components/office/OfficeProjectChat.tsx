import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, MessageSquareText, SendHorizonal, Sparkles, User } from "lucide-react";
import type { OfficeChatThread } from "@shared/office";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type OfficeProjectChatProps = {
  projectId: string;
  projectQueryKey: string;
};

const starterPrompts = [
  "Customer is Meadowbrook Homes. Update the project details and assumptions from that.",
  "Use the uploaded plans, build the takeoff, approve the living areas, and leave the garage unapproved.",
  "Change installation labor to $4.75 per sq ft for this job only and add haul-away.",
  "Update the company price book so underlayment is optional and flooring material is $92 per box.",
];

export function OfficeProjectChat({ projectId, projectQueryKey }: OfficeProjectChatProps) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const chatKey = useMemo(() => `/api/office/chat?projectId=${projectId}`, [projectId]);

  const chatQuery = useQuery({
    queryKey: [chatKey],
  });
  const chatResponse = chatQuery.data as { success: true; data: OfficeChatThread } | undefined;
  const thread = chatResponse?.data;
  const messages = thread?.messages || [];

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", chatKey, { message });
      return response.json() as Promise<{ success: true; data: OfficeChatThread }>;
    },
    onSuccess: async (payload) => {
      queryClient.setQueryData([chatKey], payload);
      queryClient.setQueryData([projectQueryKey], { success: true, data: payload.data.bundle });
      await queryClient.invalidateQueries({ queryKey: ["/api/office/projects"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/office/price-book"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/office/quote?projectId=${projectId}`] });
      setInput("");
    },
    onError: (error) => {
      toast({
        title: "Message not sent",
        description: error instanceof Error ? error.message : "The estimator could not respond.",
        variant: "destructive",
      });
    },
  });

  const submitMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) {
      return;
    }
    sendMutation.mutate(trimmed);
  };

  return (
    <Card className="min-h-[720px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-primary" />
          Estimator Chat
        </CardTitle>
        <CardDescription>
          Tell the estimator what changed in plain English. It can update project details, takeoffs, pricing, and company defaults without dropping you into raw form fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-96px)] flex-col gap-4">
        <ScrollArea className="min-h-0 flex-1 rounded-md border bg-muted/20 p-4">
          <div className="space-y-4 pr-3">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                  Start with the customer, the job, or the pricing change you want. The assistant will turn that into project updates and keep the quote math in sync.
                </div>
                <div className="grid gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-md border bg-background px-3 py-3 text-left text-sm transition-colors hover:bg-muted"
                      onClick={() => submitMessage(prompt)}
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              return (
                <div key={message.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-md border px-4 py-3 ${isAssistant ? "bg-background" : "border-primary/30 bg-primary/5"}`}>
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      <span>{isAssistant ? "Estimator" : "You"}</span>
                      <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                    {message.effects.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.effects.map((effect, index) => (
                          <Badge key={`${message.id}-${index}`} variant="secondary">
                            {effect.summary}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {sendMutation.isPending ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground">
                  Thinking through the estimate...
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Example: Set install labor to $4.75 per sq ft for this job, keep garage unapproved, and add a note that furniture moving is excluded."
            className="min-h-28 resize-none"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                submitMessage(input);
              }
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Press Cmd/Ctrl + Enter to send.</div>
            <Button onClick={() => submitMessage(input)} disabled={sendMutation.isPending || input.trim().length === 0}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              {sendMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
