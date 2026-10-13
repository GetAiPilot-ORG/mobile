import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ProductHeading } from "@/components/ProductUI";
interface AnimatedHeroProps {
  tagText: string;
  tagIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  variant?:
  | 'forward'
  | 'tracker'
  | 'overview'
  | 'sub_manager'
  | 'reactions'
  | 'chatbot'
  | 'report'
  | 'auto_approve'
  | 'broadcast'
  | 'pricing';
}

export const AnimatedHero: React.FC<AnimatedHeroProps> = ({ title, subtitle }) => <ProductHeading title={title} description={subtitle} />;
