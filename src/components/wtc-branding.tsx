import { cn } from "@/lib/utils";

interface WTCCoinLogoProps {
  size?: "small" | "large";
  className?: string;
}

export const WTCCoinLogo = ({ size = "large", className }: WTCCoinLogoProps) => {
  const sizeClass = size === "small" ? "w-12 h-12" : "w-16 h-16";
  
  return (
    <div className={cn(sizeClass, "flex items-center justify-center", className)}>
      <img 
        src="https://i.imgur.com/DRNyNkj.png"
        alt="Welcome to Chinatown Coin Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to CSS version if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextSibling) {
            (target.nextSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
      {/* Fallback CSS version */}
      <div className="w-full h-full bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-lg relative" style={{display: 'none'}}>
        <div className="absolute inset-1 rounded-full border-2 border-slate-800"></div>
        <div className="text-slate-800 font-bold relative z-10 text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs">歡</div>
          <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2 text-sm">W</div>
          <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 text-sm">C</div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 text-xs">迎</div>
          <div className="w-4 h-4 bg-slate-800 transform rotate-45 border border-yellow-400"></div>
        </div>
      </div>
    </div>
  );
};

export const WTCMainLogo = () => (
  <div className="relative max-w-sm mx-auto">
    <img 
      src="https://i.imgur.com/Ss9v8Gz.png"
      alt="Welcome to Chinatown Main Logo"
      className="w-full h-auto object-contain"
      onError={(e) => {
        // Fallback to CSS version if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        if (target.nextSibling) {
          (target.nextSibling as HTMLElement).style.display = 'block';
        }
      }}
    />
    {/* Fallback CSS version */}
    <div className="bg-slate-800 border-4 border-yellow-400 px-6 py-4 relative rounded-lg shadow-lg" style={{display: 'none'}}>
      {/* Decorative coins - left */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
        <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-slate-800 flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-800 transform rotate-45"></div>
        </div>
        <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-slate-800 flex items-center justify-center -mt-1">
          <div className="w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      </div>
      
      {/* Decorative coins - right */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
        <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-slate-800 flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-800 transform rotate-45"></div>
        </div>
        <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-slate-800 flex items-center justify-center -mt-1">
          <div className="w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      </div>
      
      {/* Main text */}
      <div className="text-yellow-400 text-center">
        <div className="text-xl font-bold tracking-wider mb-1 font-serif">
          WELC
          <span className="inline-block mx-1 align-middle">
            <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-slate-800 inline-flex items-center justify-center">
              <div className="text-slate-800 text-xs font-bold">歡</div>
            </div>
          </span>
          ME
        </div>
        <div className="text-xl font-bold tracking-wider font-serif">
          CHINATOWN
        </div>
      </div>
    </div>
  </div>
);

interface WTCFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const WTCFrame = ({ children, className }: WTCFrameProps) => (
  <div className={cn("relative", className)}>
    {/* Corner decorations */}
    <div className="absolute -top-2 -left-2 w-6 h-6">
      <div className="w-full h-full border-l-2 border-t-2 border-yellow-400 rounded-tl-lg"></div>
      <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
    </div>
    <div className="absolute -top-2 -right-2 w-6 h-6">
      <div className="w-full h-full border-r-2 border-t-2 border-yellow-400 rounded-tr-lg"></div>
      <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
    </div>
    <div className="absolute -bottom-2 -left-2 w-6 h-6">
      <div className="w-full h-full border-l-2 border-b-2 border-yellow-400 rounded-bl-lg"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
    </div>
    <div className="absolute -bottom-2 -right-2 w-6 h-6">
      <div className="w-full h-full border-r-2 border-b-2 border-yellow-400 rounded-br-lg"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
    </div>
    
    <div className="border-2 border-yellow-400 bg-white shadow-lg rounded-lg p-6 relative">
      {children}
    </div>
  </div>
);
