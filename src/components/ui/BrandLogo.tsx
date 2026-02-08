import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { NINTENDO_RED } from '../GameCrafterTheme';
import { useSidebarStore } from '../../stores/sidebarStore';

interface BrandLogoProps {
  /**
   * Whether to show only the icon (compact mode)
   */
  compact?: boolean;
  
  /**
   * Custom game name to display
   */
  gameName?: string;
  
  /**
   * Whether to show toggle button
   */
  showToggle?: boolean;
  
  /**
   * Optional click handler for logo (called before sidebar toggle)
   */
  onClick?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BrandLogo component for consistent brand presentation
 * Can be clicked to toggle sidebar and includes optional toggle button
 */
const BrandLogo: React.FC<BrandLogoProps> = ({
  compact = false,
  gameName,
  showToggle = false,
  onClick,
  className = ''
}) => {
  // Use sidebar context for state and toggle
  const { isNavOpen, isSidebarCollapsed, toggleSidebar } = useSidebarStore();
  
  // Log the sidebar state in this component
  // BrandLogo state: isNavOpen, isSidebarCollapsed
  
  // Handle click on logo - always toggles sidebar
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Logo clicked
    
    // Execute custom click handler if provided
    if (onClick) {
      onClick();
    }
    
    // Always toggle the sidebar when the logo is clicked
    // Calling toggleSidebar
    toggleSidebar();
  };
  
  // Handle toggle button click - does exactly the same as logo click
  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Chevron toggle clicked
    // Calling toggleSidebar
    toggleSidebar();
  };
  
  // Handle keydown events for keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll on space
      toggleSidebar();
    }
  };

  // Determine logo size based on current sidebar state and compact prop
  // When sidebar is collapsed (isSidebarCollapsed=true) or compact mode is active, 
  // show larger standalone logo, otherwise show smaller logo with text
  const logoSize = compact || isSidebarCollapsed ? "w-10 h-10" : "w-8 h-8 mr-2";
  // Apply className if provided, otherwise use calculated logo size
  const finalLogoSize = className ? `${logoSize} ${className}` : logoSize;
  // Using calculated logo size

  return (
    <div className="flex items-center">
      {/* Logo Area */}
      <div 
        className="flex items-center cursor-pointer"
        onClick={handleLogoClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Toggle sidebar navigation"
        data-testid="brand-logo-clickable"
      >
        {/* Brand Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <img 
            src="/assets/brand/logo-small.svg" 
            alt="Game Crafter Logo" 
            className={finalLogoSize}
            style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}
          />
        </motion.div>
        
        {/* Brand Text - Only show when not compact AND sidebar is expanded (not collapsed) */}
        {!compact && !isSidebarCollapsed && (
          <div className="flex items-center font-semibold">
            <span className="text-lg uw2:text-5xl">Game Crafter</span>
            
            {/* Show game name if provided */}
            {gameName && (
              <>
                <span className="mx-2 text-gray-400 uw2:text-4xl">|</span>
                <span className="text-sm uw2:text-4xl font-normal text-gray-500 max-w-[200px] uw2:max-w-[400px] truncate">
                  {gameName}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Toggle Button - Only show when requested */}
      {showToggle && (
        <motion.button
          className="ml-3 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={handleToggleClick}
          aria-label={!isSidebarCollapsed ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={!isSidebarCollapsed}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: !isSidebarCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          style={{ color: NINTENDO_RED }}
          data-testid="sidebar-toggle-button"
          title={!isSidebarCollapsed ? "Collapse sidebar" : "Expand sidebar"}
        >
          {!isSidebarCollapsed ? (
            <ChevronLeft size={16} className="uw:w-10 uw:h-10" />
          ) : (
            <ChevronRight size={16} className="uw:w-10 uw:h-10" />
          )}
        </motion.button>
      )}
    </div>
  );
};

export default BrandLogo;