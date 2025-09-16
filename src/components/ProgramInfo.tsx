
import { Calendar, Clock, Film, Tv } from "lucide-react";

interface ProgramInfoProps {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
}

const ProgramInfo = ({ 
  title, 
  description = "No program information available",
  startTime,
  endTime,
  category
}: ProgramInfoProps) => {
  return (
    <div className="bg-dark-200 rounded-lg border border-gray-800 p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Film className="text-gold h-5 w-5" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      
      {startTime && endTime && (
        <div className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
          <Clock className="text-gray-400 h-4 w-4" />
          <span>{startTime} - {endTime}</span>
        </div>
      )}
      
      {category && (
        <div className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
          <Tv className="text-gray-400 h-4 w-4" />
          <span>{category}</span>
        </div>
      )}
      
      <p className="text-gray-400 text-sm mt-2">{description}</p>
    </div>
  );
};

export default ProgramInfo;
