"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentProvider } from "@/types/payments";
import { PaymentFactory } from "@/lib/payments/payment-factory";

interface PaymentProviderSelectorProps {
  onSelect: (provider: PaymentProvider) => void;
  disabled?: boolean;
  selectedProvider?: PaymentProvider;
}

export function PaymentProviderSelector({
  onSelect,
  disabled = false,
  selectedProvider,
}: PaymentProviderSelectorProps) {
  const providers = PaymentFactory.getSupportedProviders();

  const getProviderInfo = (provider: PaymentProvider) => {
    switch (provider) {
      case "MTN_MOMO":
        return {
          name: "MTN Mobile Money",
          description: "Pay using your MTN MoMo account",
          icon: "📱",
          features: ["USSD/SMS prompt", "No app required", "Instant feedback"],
        };
      case "FAPSHI":
        return {
          name: "Fapshi",
          description: "Accept payments via Fapshi (aggregated MTN/Orange)",
          icon: "🧾",
          features: ["Hosted links or API integration", "Unified webhook", "Sandbox & live keys"],
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
        <p className="text-sm text-muted-foreground">Choose how you'd like to pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const info = getProviderInfo(provider);
          const isSelected = selectedProvider === provider;

          return (
            <Card
              key={provider}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary hover:shadow-md"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onSelect(provider)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info?.icon}</span>
                    <div>
                      <CardTitle className="text-base">{info?.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {info?.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge className="bg-green-600 hover:bg-green-700">Selected</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Key Features
                    </p>
                    <ul className="space-y-1">
                      {info?.features.map((feature, idx) => (
                        <li key={idx} className="text-xs flex items-center gap-2">
                          <span className="text-primary">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full mt-4"
                    variant={isSelected ? "default" : "outline"}
                    disabled={disabled}
                    onClick={() => onSelect(provider)}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 How it works</p>
        <ul className="space-y-1 text-blue-800 dark:text-blue-200 text-xs">
          <li>
            <strong>MTN MoMo:</strong> You'll receive a USSD prompt on your phone to confirm the
            payment
          </li>
        </ul>
      </div>
    </div>
  );
}
