export interface SystemDesignQuestion {
    question: string;
    difficulty: string;
}

export interface SystemDesignSubmission {
    question: string;
    answer: string;
    designed_system_image_base64: string;
}

export interface SystemDesignSubmissionAIRequest {
    question: string;
    answer: string;
    designed_system_image_url: string;
}

export interface SystemDesignSubmissionAIResponse {
    grade: number;
    feedback: string;
}