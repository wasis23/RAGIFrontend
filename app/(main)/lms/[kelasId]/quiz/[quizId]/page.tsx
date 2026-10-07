'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import QuizEngine from '@/components/lms/QuizEngine';

interface PageProps {
  params: Promise<{ kelasId: string; quizId: string }>;
}

export default function KerjakanQuizPage({ params }: PageProps) {
  const { kelasId, quizId } = use(params);

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Kerjakan Quiz"
        description="Jawaban tersimpan otomatis tiap 30 detik"
        backUrl={`/lms/${kelasId}`}
      />
      <QuizEngine quizId={Number(quizId)} />
    </div>
  );
}
