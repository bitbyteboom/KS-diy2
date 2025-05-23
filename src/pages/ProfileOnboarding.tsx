import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, Profile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { setApiConfig, getApiKey, getApiBaseUrl } from '@/services/aiService';
import { toast } from "sonner";

const ProfileOnboarding = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useProfile();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [avatar, setAvatar] = useState('1');
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [apiKey, setApiKeyState] = useState('');
  const [apiBaseUrl, setApiBaseUrlState] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setGradeLevel(profile.gradeLevel);
      setAvatar(profile.avatar);
      setPreferredSubjects(profile.preferredSubjects);
    }
    const savedApiKey = getApiKey();
    if (savedApiKey) setApiKeyState(savedApiKey);
    const savedBaseUrl = getApiBaseUrl();
    if (savedBaseUrl) setApiBaseUrlState(savedBaseUrl);
  }, [profile]);

  const suggestGradeLevel = (ageValue: string) => {
    const ageNum = parseInt(ageValue);
    if (!isNaN(ageNum)) {
      if (ageNum < 5) return 'K';
      if (ageNum <= 18) {
        const grade = ageNum - 5;
        if (grade >= 0 && grade <= 12) {
          return grade === 0 ? 'K' : `${grade}${getOrdinalSuffix(grade)} Grade`;
        }
      }
    }
    return '';
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = e.target.value;
    setAge(newAge);
    const suggested = suggestGradeLevel(newAge);
    setGradeLevel(suggested);
  };

  const handleSubjectToggle = (subject: string) => {
    setPreferredSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gradeLevel) {
      toast.error("Please tell us your name and grade level");
      return;
    }
    if (!apiKey || !apiBaseUrl) {
      toast.error("Please enter your API base URL and key");
      return;
    }
    const newProfile: Profile = {
      name,
      gradeLevel,
      avatar,
      preferredSubjects: preferredSubjects.length > 0 ? preferredSubjects : ['Math']
    };
    setProfile(newProfile);
    setApiConfig(apiBaseUrl, apiKey);
    toast.success("Your awesome profile is saved! Let's start learning!");
    navigate('/learn');
  };

  const nextStep = () => {
    if (currentStep === 0 && !name) {
      toast.error("Please tell us your name");
      return;
    }
    if (currentStep === 1 && !age) {
      toast.error("Please tell us your age");
      return;
    }
    if (currentStep === 1 && !gradeLevel) {
      toast.error("Please select your grade level");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const subjects = [
    'Math', 'Science', 'English', 'History', 
    'Geography', 'Literature', 'Computer Science', 'Art'
  ];

  const gradeLevels = [
    'K', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
    '5th Grade', '6th Grade', '7th Grade', '8th Grade',
    '9th Grade', '10th Grade', '11th Grade', '12th Grade'
  ];

  const avatars = [1, 2, 3, 4, 5, 6];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold">Hi there! What's your name?</h3>
              <p className="text-muted-foreground">We're so excited to meet you!</p>
            </div>
            <div className="space-y-4">
              <Label htmlFor="name">My name is...</Label>
              <Input
                id="name"
                placeholder="Type your name here"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
                autoFocus
              />
              <Button onClick={nextStep} className="w-full bg-edu-purple hover:bg-edu-purple/90 mt-4">Next</Button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold">How old are you?</h3>
              <p className="text-muted-foreground">And your preferred current grade level:</p>
            </div>
            <div className="space-y-4">
              <Label htmlFor="age">I am...</Label>
              <Input
                id="age"
                type="number"
                min="3"
                max="18"
                placeholder="Enter your age"
                value={age}
                onChange={handleAgeChange}
                className="text-lg"
              />
              <Label htmlFor="grade">Preferred current grade level:</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select your grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-between mt-4">
                <Button onClick={prevStep} variant="outline">Back</Button>
                <Button onClick={nextStep} className="bg-edu-purple hover:bg-edu-purple/90">Next</Button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold">Choose your avatar!</h3>
              <p className="text-muted-foreground">Pick your favorite</p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4">
              {avatars.map((num) => (
                <div
                  key={num}
                  onClick={() => setAvatar(String(num))}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    avatar === String(num) ? 'scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-edu-purple to-edu-teal flex items-center justify-center text-white font-bold text-2xl ${
                    avatar === String(num) ? 'ring-4 ring-edu-purple' : ''
                  }`}>
                    {num}
                  </div>
                  <span className={`mt-2 ${avatar === String(num) ? 'font-bold' : ''}`}>Avatar {num}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline">Back</Button>
              <Button onClick={nextStep} className="bg-edu-purple hover:bg-edu-purple/90">Next</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold">What subjects do you like?</h3>
              <p className="text-muted-foreground">Select all that you enjoy</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {subjects.map((subject) => (
                <button
                  type="button"
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  className={`px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-center ${
                    preferredSubjects.includes(subject)
                      ? 'bg-edu-purple text-white font-medium'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline">Back</Button>
              <Button onClick={nextStep} className="bg-edu-purple hover:bg-edu-purple/90">Next</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold">One last step!</h3>
              <p className="text-muted-foreground">Enter your API base URL and key</p>
            </div>
            <div className="space-y-4">
              <Label htmlFor="apiBaseUrl">API Base URL</Label>
              <Input
                id="apiBaseUrl"
                placeholder="e.g. https://api.openai.com/v1 or https://openrouter.ai/api/v1"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrlState(e.target.value)}
              />
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Your API key and URL are stored securely in your browser's local storage.
              </p>
              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">Back</Button>
                <Button onClick={handleSubmit} className="bg-edu-purple hover:bg-edu-purple/90">Finish Setup</Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-10">
        <div className="edu-container max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-edu-purple to-edu-teal bg-clip-text text-transparent">
                Create Your Learning Profile
              </span>
            </h1>
          </div>
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileOnboarding;
