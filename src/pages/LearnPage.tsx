import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  generateResponse,
  ChatMessage,
  generateQuestion,
  checkAnswer
} from '@/services/aiService';
import { toast } from "sonner";

const relicTiers = [
  "Seeker",
  "Learner",
  "Scholar",
  "Adept",
  "Sage",
  "Mentor",
  "Master",
  "Luminary",
  "Virtuoso",
  "Prodigy"
];

// rest of the file remains unchanged
