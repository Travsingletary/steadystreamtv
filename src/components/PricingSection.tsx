import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentButton } from "@/components/PaymentButton";
import { PaymentService } from "@/services/paymentService";

const PricingSection = () => {
  const plans = PaymentService.getAllPlans();

  return (
    <section className="py-24 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant access to thousands of channels, premium content, and crystal-clear streaming
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                plan.popular 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.id === 'trial' ? 'Perfect for testing' : 
                   plan.id === 'basic' ? 'Great for individuals' :
                   plan.id === 'duo' ? 'Perfect for couples' :
                   'Ideal for families'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-6">
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm">/month</span>
                  )}
                </div>

                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-left">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-0">
                <PaymentButton
                  planId={plan.id}
                  planName={plan.name}
                  price={plan.price}
                  currency={plan.currency}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90' 
                      : ''
                  }`}
                />
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ✓ No setup fees • ✓ Cancel anytime • ✓ 24/7 support • ✓ 30-day money-back guarantee
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
            <span>🔒 Secure Payment</span>
            <span>•</span>
            <span>💳 All Cards Accepted</span>
            <span>•</span>
            <span>⚡ Instant Activation</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;