import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { setApiConfig, getApiKey, getApiBaseUrl } from '@/services/aiService';
import { toast } from "sonner";

const ProfileViewEdit = () => {
  const { profile, setProfile } = useProfile();

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [avatar, setAvatar] = useState('1');
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [apiKey, setApiKeyState] = useState('');
  const [apiBaseUrl, setApiBaseUrlState] = useState('');

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

  const handleSubjectToggle = (subject: string) => {
    setPreferredSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleSave = () => {
    if (!name || !gradeLevel) {
      toast.error("Please enter your name and grade level");
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
    toast.success("Profile updated!");
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-10">
        <div className="edu-container max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-edu-purple to-edu-teal bg-clip-text text-transparent">
              My Profile
            </span>
          </h1>
          <div className="space-y-4">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />

            <Label>Grade Level</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label>Avatar</Label>
            <div className="grid grid-cols-3 gap-4">
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

            <Label>Preferred Subjects</Label>
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

            <Label>API Base URL</Label>
            <Input
              placeholder="e.g. https://api.openai.com/v1"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrlState(e.target.value)}
            />

            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
            />

            <Button onClick={handleSave} className="w-full bg-edu-purple hover:bg-edu-purple/90 mt-4">
              Save Profile
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileViewEdit;
