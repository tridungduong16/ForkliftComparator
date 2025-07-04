import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import pdfParse from 'pdf-parse';

// Function to extract text from PDF
export async function extractTextFromPDF(filePath: string, openaiClient?: OpenAI): Promise<any> {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF content
    const data = await pdfParse(dataBuffer);
    
    // Extract text
    const text = data.text;
    
    // If OpenAI client is available, use it to extract structured data
    if (openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a forklift specification extraction expert. Extract key specifications from the provided brochure text."
            },
            {
              role: "user",
              content: `Extract the following information from this forklift brochure text:\n\n${text.substring(0, 8000)}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
        
        return JSON.parse(response.choices[0].message.content || '{}');
      } catch (aiError) {
        console.error('AI extraction error:', aiError);
        return { text, error: 'AI extraction failed' };
      }
    }
    
    // Return just the text if no AI client
    return { text };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}