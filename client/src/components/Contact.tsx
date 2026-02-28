import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSubmissionSchema, type InsertContactSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, CircleCheckBig } from "lucide-react";

export function Contact() {
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm<InsertContactSubmission>({
    resolver: zodResolver(insertContactSubmissionSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      projectType: "",
      location: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertContactSubmission) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setShowSuccessDialog(true);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try calling us instead.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertContactSubmission) => {
    mutation.mutate(data);
  };

  return (
    <>
      <section className="py-16 lg:py-24 bg-card" id="contact">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-heading font-semibold text-foreground mb-4">
              Get Your Free Estimate
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Ready to transform your space? Contact us today for a free, no-obligation estimate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your full name"
                            {...field}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(414) 555-0123"
                          type="tel"
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your@email.com"
                          type="email"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Milwaukee, WI"
                          {...field}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type & Overview</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your flooring project..."
                          className="resize-none min-h-32"
                          {...field}
                          data-testid="input-project-type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-ring text-white border-ring font-heading font-semibold"
                    disabled={mutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {mutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-6">
                Contact Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <a
                      href="tel:+14142751889"
                      className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                      data-testid="link-phone-contact"
                    >
                      (414) 275-1889
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <a
                      href="mailto:Pepremiumflooring@gmail.com"
                      className="text-lg font-semibold text-foreground hover:text-primary transition-colors break-all"
                      data-testid="link-email-contact"
                    >
                      Pepremiumflooring@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Service Area</p>
                    <p className="text-lg font-semibold text-foreground">
                      Milwaukee Metro Area
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/10 overflow-visible">
              <CardContent className="p-8">
                <h4 className="text-xl font-heading font-semibold text-foreground mb-4">
                  Why Choose Us?
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-ring mt-1">•</span>
                    <span>Free estimates with no obligation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ring mt-1">•</span>
                    <span>Same-day response to inquiries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ring mt-1">•</span>
                    <span>Licensed and insured professionals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ring mt-1">•</span>
                    <span>Quality workmanship guaranteed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </section>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-xl p-8 sm:p-10" data-testid="dialog-contact-success">
          <DialogHeader className="items-center text-center gap-3">
            <CircleCheckBig className="h-14 w-14 text-green-600" />
            <DialogTitle className="text-2xl sm:text-3xl font-heading">
              Message Sent Successfully
            </DialogTitle>
            <DialogDescription className="text-base sm:text-lg max-w-md">
              Thanks for reaching out. We received your request and will contact you within 24
              hours to discuss your flooring project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-2">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-ring text-white border-ring font-heading font-semibold"
              onClick={() => setShowSuccessDialog(false)}
              data-testid="button-close-success-dialog"
            >
              Great, Thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
