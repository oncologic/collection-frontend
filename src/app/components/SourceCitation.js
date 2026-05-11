import React from 'react';
import { FaExternalLinkAlt, FaBookOpen, FaLink } from 'react-icons/fa';

const SourceCitation = ({ source, index }) => {
  // Extract URL from source text
  const urlMatch = source.match(/https?:\/\/[^\s]+/);
  const url = urlMatch ? urlMatch[0] : null;
  
  // Extract title from markdown link format [title](url)
  const linkMatch = source.match(/\[([^\]]+)\]\(([^)]+)\)/);
  const title = linkMatch ? linkMatch[1] : source.replace(/Source:\s*/i, '').replace(url || '', '').trim();
  
  return (
    <div className="group relative mt-6 mb-4">
      {/* Decorative line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-transparent opacity-50"></div>
      
      <div className="ml-16 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
            <FaBookOpen className="w-4 h-4 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Source {index}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>
            
            {url ? (
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link block"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 group-hover/link:text-blue-700 transition-colors duration-200 line-clamp-2">
                    {title || 'View Source'}
                  </span>
                  <FaExternalLinkAlt className="w-3 h-3 text-blue-500 opacity-0 group-hover/link:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                </div>
                <div className="mt-1 text-xs text-gray-500 truncate group-hover/link:text-blue-600 transition-colors duration-200">
                  {new URL(url).hostname}
                </div>
              </a>
            ) : (
              <div className="text-sm text-gray-700">
                {title}
              </div>
            )}
          </div>
        </div>
        
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default SourceCitation;