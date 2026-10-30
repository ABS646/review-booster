'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', params.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [params.id]);

  if (!profile) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 max-w-sm w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <Star className="text-yellow-400 fill-yellow-400 w-12 h-12" />
        </div>
        
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">How was your experience?</h1>
            <p className="text-gray-400 mb-8">with {profile.business_name}</p>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl flex flex-col items-center gap-2 transition">
                <ThumbsUp className="w-6 h-6" /> <span>Loved it!</span>
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl flex flex-col items-center gap-2 transition">
                <ThumbsDown className="w-6 h-6" /> <span>Not great</span>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="animate-in fade-in zoom-in duration-300">
            <h1 className="text-2xl font-bold text-white mb-2">That's amazing!</h1>
            <p className="text-gray-400 mb-6">Could you share the love on Google? It takes 10 seconds.</p>
            <a href={profile.google_review_link} target="_blank" rel="noopener noreferrer" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition">
              Leave a Google Review
            </a>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in zoom-in duration-300">
            <h1 className="text-xl font-bold text-white mb-2">We're sorry to hear that.</h1>
            <p className="text-gray-400 mb-4 text-sm">Please tell the owner what went wrong so they can fix it.</p>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white mb-4 h-24"
              placeholder="What happened?"
            />
            <button onClick={() => setStep(4)} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition">
              Send Private Feedback
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in zoom-in duration-300">
            <h1 className="text-xl font-bold text-white mb-2">Thank you.</h1>
            <p className="text-gray-400 text-sm">Your feedback has been sent directly to {profile.business_name}. They will use this to improve.</p>
          </div>
        )}
      </div>
    </div>
  );
}