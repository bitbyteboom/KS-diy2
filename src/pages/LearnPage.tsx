import React, { useState, useEffect, useRef } from 'react';
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
  generateQuestion,
  checkAnswer,
  ChatMessage
} from '@/services/aiService';
import { toast } from "sonner";
import { marked } from 'marked';

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

const LearnPage = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useProfile();

  const [profileLoaded, setProfileLoaded] = useState(false);

  const [subject, setSubject] = useState<string>('All');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState<boolean>(false);
  const [subjectQueue, setSubjectQueue] = useState<string[]>([]);
  const [subjectIndex, setSubjectIndex] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) {
      navigate('/profile');
    } else {
      setProfileLoaded(true);
      const subs = profile.preferredSubjects.length > 0 ? profile.preferredSubjects : ['Math', 'Science', 'English'];
      setSubjectQueue(subs);
      setSubject('All');
      setSubjectIndex(0);
      setQuestionCount(0);
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const getCurrentSubject = () => {
    if (subject !== 'All') return subject;
    return subjectQueue[subjectIndex % subjectQueue.length];
  };

  const updateLevel = (subjectName: string, correct: boolean) => {
    if (!profile) return;
    const levels = { ...(profile.subjectLevels || {}) };
    const current = levels[subjectName] || { tier: 1, seal: 1 };
    if (correct) {
      current.seal++;
      if (current.seal > 5) {
        current.seal = 1;
        current.tier = Math.min(10, current.tier + 1);
      }
    } else {
      current.seal--;
      if (current.seal < 1) {
        if (current.tier > 1) {
          current.tier--;
          current.seal = 5;
        } else {
          current.seal = 1;
        }
      }
    }
    levels[subjectName] = current;
    setProfile({ ...profile, subjectLevels: levels });
  };

  const badge = (() => {
    const lvl = profile?.subjectLevels?.[getCurrentSubject()] || { tier:1, seal:1 };
    return `${relicTiers[lvl.tier -1]} - Seal ${lvl.seal}`;
  })();

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsLoading(true);
    try {
      const gradeLevel = profile?.gradeLevel || '5th Grade';
      const assistantResponse = await generateResponse(
        [...chatMessages, newUserMessage],
        getCurrentSubject(),
        gradeLevel,
        badge,
        profile
      );
      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Couldn't get a response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuestion = async () => {
    if (!profile || isGeneratingQuestion) return;
    setIsGeneratingQuestion(true);
    setUserAnswer('');
    setFeedback(null);
    setIsAnswerCorrect(null);
    try {
      const { question, correctAnswer: answer } = await generateQuestion(
        chatMessages,
        getCurrentSubject(),
        profile.gradeLevel,
        badge,
        profile,
        previousQuestions
      );
      setCurrentQuestion(question);
      setCorrectAnswer(answer);
      setPreviousQuestions(prev => [...prev, question]);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error generating question:', error);
      toast.error("Couldn't generate a question");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion || !correctAnswer) return;
    setIsLoading(true);
    try {
      const result = await checkAnswer(
        currentQuestion,
        userAnswer,
        correctAnswer,
        getCurrentSubject(),
        profile?.gradeLevel || '5th Grade'
      );
      setFeedback(result.explanation);
      setIsAnswerCorrect(result.isCorrect);
      updateLevel(getCurrentSubject(), result.isCorrect);
    } catch (error) {
      console.error('Error checking answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setFeedback(null);
    setIsAnswerCorrect(null);
    if (subject === 'All' && questionCount >= 5) {
      setQuestionCount(0);
      setSubjectIndex((prev) => (prev + 1) % subjectQueue.length);
    }
    handleGenerateQuestion();
  };

  useEffect(() => {
    if (profileLoaded) handleGenerateQuestion();
  }, [profileLoaded, subjectQueue, subjectIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-6">
        {profileLoaded ? (
          <div className="edu-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-edu-purple to-edu-teal flex items-center justify-center text-white font-bold">
                  {profile?.avatar}
                </div>
                <div>
                  <h2 className="font-semibold">{profile?.name}</h2>
                  <p className="text-sm text-gray-500">{profile?.gradeLevel}</p>
                  <p className="text-xs mt-1 font-semibold">{badge}</p>
                </div>
              </div>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Subjects</SelectItem>
                  {subjectQueue.map((subj) => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="quiz" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="quiz">Quest Mode</TabsTrigger>
                <TabsTrigger value="chat">Chat with Rune</TabsTrigger>
              </TabsList>

              <TabsContent value="quiz" className="border-none p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md border p-6 mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {getCurrentSubject()} - {badge}
                      </h3>
                      {currentQuestion ? (
                        <div className="question-box rounded-lg p-4 mb-4">
                          <p className="text-lg">{currentQuestion}</p>
                        </div>
                      ) : (
                        <div className="question-box rounded-lg p-4 mb-4 animate-pulse">
                          <p className="text-gray-400">Generating question...</p>
                        </div>
                      )}
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Type your answer here..."
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="answer-input min-h-[100px]"
                          disabled={isLoading || !currentQuestion}
                        />
                        <div className="flex justify-end gap-2">
                          {isAnswerCorrect ? (
                            <Button
                              onClick={handleNextQuestion}
                              className="bg-edu-teal hover:bg-edu-teal/90"
                            >
                              Next Question
                            </Button>
                          ) : (
                            <Button
                              onClick={handleCheckAnswer}
                              disabled={isLoading || !userAnswer.trim() || !currentQuestion}
                              className="bg-edu-purple hover:bg-edu-purple/90"
                            >
                              {isAnswerCorrect === false ? 'Try Again' : 'Check Answer'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white rounded-xl shadow-md border p-6 h-full">
                      <h2 className="text-xl font-semibold mb-4">Feedback</h2>
                      {feedback ? (
                        <div>
                          <div className={`feedback-box p-4 rounded-lg mb-4 ${
                            isAnswerCorrect 
                              ? 'text-green-800' 
                              : 'text-orange-800'
                          }`}>
                            <p className="font-semibold mb-1">
                              {isAnswerCorrect ? 'Correct! 🎉' : 'Not quite right 🤔'}
                            </p>
                            <p className="text-sm">{feedback}</p>
                          </div>
                          <Button
                            onClick={handleNextQuestion}
                            className="w-full bg-edu-teal hover:bg-edu-teal/90"
                          >
                            Next Question
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-center">
                          <p>Submit your answer to see feedback</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="border-none p-0">
                <div className="bg-white rounded-xl shadow-md border flex flex-col h-[500px]">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Chat with Rune</h2>
                    <p className="text-sm text-gray-500">Ask questions, get help, or just chat!</p>
                  </div>
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 prose prose-sm max-w-none"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-xl p-3 ${
                              msg.role === 'user' ? 'bg-edu-purple text-white' : 'bg-gray-100'
                            }`}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(msg.content)
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-xl p-3">
                          <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !userMessage.trim()}
                      className="bg-edu-teal hover:bg-edu-teal/90"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Loading your profile...</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LearnPage;
