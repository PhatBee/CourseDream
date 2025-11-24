import React from 'react';
import { Check, Users, Target } from 'lucide-react';

const CourseOverview = ({ course }) => {
  const {
    description = '',
    learnOutcomes = [],
    requirements = []
  } = course;

  // Helper function to parse and render formatted description
  const renderDescription = (desc) => {
    if (!desc) return null;

    const lines = desc.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = { type: 'paragraph', content: [] };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check if it's a numbered list item (e.g., "1. Item", "2. Item")
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);

      // Check if it's a section header (ends with :)
      if (trimmedLine.endsWith(':') && !trimmedLine.startsWith('•') && !numberedMatch) {
        // Save previous section if it has content
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        // Start new section
        currentSection = {
          type: 'section',
          title: trimmedLine.slice(0, -1), // Remove the colon
          content: []
        };
      }
      // Check if it's a numbered list item
      else if (numberedMatch) {
        if (currentSection.type !== 'numbered') {
          // Save previous section
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { type: 'numbered', content: [] };
        }
        currentSection.content.push({
          number: numberedMatch[1],
          text: numberedMatch[2]
        });
      }
      // Check if it's a bullet point
      else if (trimmedLine.startsWith('•')) {
        if (currentSection.type !== 'list') {
          // Save previous section
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { type: 'list', content: [] };
        }
        currentSection.content.push(trimmedLine.substring(1).trim());
      }
      // Regular paragraph text
      else if (trimmedLine) {
        if (currentSection.type === 'list' || currentSection.type === 'section' || currentSection.type === 'numbered') {
          sections.push(currentSection);
          currentSection = { type: 'paragraph', content: [] };
        }
        currentSection.content.push(trimmedLine);
      }
    });

    // Add the last section
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections.map((section, idx) => {
      if (section.type === 'section') {
        return (
          <div key={idx} className="mb-6">
            <h6 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              {section.title.includes('Learn') && <Target className="w-5 h-5 mr-2 text-blue-600" />}
              {section.title.includes('Who') && <Users className="w-5 h-5 mr-2 text-purple-600" />}
              {section.title}
            </h6>
            <ul className="space-y-2 ml-7">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      } else if (section.type === 'numbered') {
        return (
          <ol key={idx} className="space-y-3 mb-4">
            {section.content.map((item, i) => (
              <li key={i} className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold mr-3">
                  {item.number}
                </span>
                <span className="text-gray-700 pt-1">{item.text}</span>
              </li>
            ))}
          </ol>
        );
      } else if (section.type === 'list') {
        return (
          <ul key={idx} className="space-y-2 mb-4">
            {section.content.map((item, i) => (
              <li key={i} className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-1" />
                <span className="text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        return (
          <div key={idx} className="mb-4">
            {section.content.map((text, i) => (
              <p key={i} className="text-gray-700 leading-relaxed mb-2">
                {text}
              </p>
            ))}
          </div>
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg">
        <h5 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
          Course Description
        </h5>
        <div className="prose max-w-none text-justify">
          {renderDescription(description)}
        </div>
      </div>

      {learnOutcomes && learnOutcomes.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <h5 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            What you'll learn
          </h5>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {learnOutcomes.map((item, index) => (
              <li key={index} className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-1" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {requirements && requirements.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-100">
          <h5 className="text-xl font-semibold text-gray-800 mb-4">Requirements</h5>
          <ul className="space-y-2">
            {requirements.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-600 mr-2 font-bold">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseOverview;