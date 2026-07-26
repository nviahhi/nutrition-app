interface AIEvaluation {
  status: 'good' | 'attention';
  comment: string;
}

const PROXY_URL = 'http://localhost:8000/ai/evaluate';

export const evaluateMealWithAI = async (
    ingredients: string,
    userComment: string = ''
): Promise<AIEvaluation> => {
    try {

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients,
                comment: userComment,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Proxy error: ${response.status} - ${error.error || 'Unknown error'}`);
        }

        const data = await response.json();

        if (data.parsedResult) {
            return {
                status: data.parsedResult.status === 'good' ? 'good' : 'attention',
                comment: data.parsedResult.comment || 'AI review',
            };
        }

        return {
            status: 'attention',
            comment: 'Failed to get AI evaluation',
        };
    } catch (error) {
        console.error('AI evaluation failed:', error);
        return {
            status: 'attention',
            comment: 'AI could not evaluate. Please consult your doctor.',
        };
    }
};