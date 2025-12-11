import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Globe, Facebook, Youtube, Linkedin, Twitter, GraduationCap, Briefcase } from 'lucide-react';

const SocialIcon = ({ Icon, url }) => {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
      <Icon size={18} />
    </a>
  );
};

const InstructorBio = ({ instructor = {} }) => {
  const {
    name = '...',
    avatar,
    skills,
    headline,
    bio,
    experience,
    education,
    specialties = [],
    socialLinks = {},
    rating = 0,
    totalReviews = 0,
    totalStudents = 0
  } = instructor;

  return (
    <div className="space-y-5 text-left">
      <h5 className="text-xl font-semibold text-gray-800">About the instructor</h5>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
          <img
            className="w-16 h-16 rounded-full object-cover"
            src={avatar || '/default-avatar.svg'}
            alt={name}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1">
          <Link to={`/instructor/${name}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {name}
          </Link>
          {headline && <p className="text-blue-600 font-medium text-sm mb-2">{headline}</p>}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span className="font-bold text-gray-700">{rating}</span> Rating
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-700">{totalReviews}</span> Reviews
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-700">{totalStudents.toLocaleString()}</span> Students
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-3">
            <SocialIcon Icon={Globe} url={socialLinks.website} />
            <SocialIcon Icon={Facebook} url={socialLinks.facebook} />
            <SocialIcon Icon={Youtube} url={socialLinks.youtube} />
            <SocialIcon Icon={Linkedin} url={socialLinks.linkedin} />
            <SocialIcon Icon={Twitter} url={socialLinks.twitter} />
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div>
          <h6 className="font-bold text-gray-800 mb-2">About Me</h6>
          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{bio}</p>
        </div>
      )}

      {/* Specialties */}
      {specialties && specialties.length > 0 && (
        <div>
          <h6 className="font-bold text-gray-800 mb-2">Specialties</h6>
          <div className="flex flex-wrap gap-2">
            {specialties.map((spec, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experience && (
        <div>
          <h6 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-500" /> Experience
          </h6>
          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">
            {experience}
          </p>
        </div>
      )}

      {/* Education */}
      {education && (
        <div>
          <h6 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <GraduationCap size={16} className="text-green-500" /> Education
          </h6>
          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">
            {education}
          </p>
        </div>
      )}

    </div>
  );
};

export default InstructorBio;