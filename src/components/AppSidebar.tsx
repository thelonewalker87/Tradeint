import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  Newspaper, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Activity,
  Upload,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    description: 'Overview & metrics',
    badge: null,
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3,
    description: 'Performance analysis',
    badge: null,
  },
  { 
    name: 'Journal', 
    href: '/journal', 
    icon: BookOpen,
    description: 'Trade records',
    badge: null,
  },
  {
    name: 'CSV Upload',
    href: '/csv-upload',
    icon: Upload,
    description: 'Import trade data',
    badge: null,
  },
  { 
    name: 'News', 
    href: '/news', 
    icon: Newspaper,
    description: 'Market updates',
    badge: '3',
  },
  { 
    name: 'Link MT5', 
    href: '/link-mt5', 
    icon: Terminal,
    description: 'Auto-sync trades',
    badge: 'NEW',
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'Preferences',
    badge: null,
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

export default function AppSidebar({ collapsed, onToggleCollapse, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div 
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300 ease-out relative h-full",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-5 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">
                Tradient
              </h1>
              <p className="text-xs text-muted-foreground">Trading Platform</p>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        )}
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-9 w-9 p-0 hover:bg-muted transition-colors duration-200 hidden lg:flex items-center justify-center rounded-lg"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-9 w-9 p-0 hover:bg-muted transition-colors duration-200 lg:hidden rounded-lg"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Navigation */}
      <nav 
        className={cn(
          "relative z-10 flex-1 overflow-y-auto",
          collapsed ? "px-3 py-4" : "px-3 py-4"
        )}
      >
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  to={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-lg transition-colors duration-200",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                  )}>
                    <item.icon className="w-[18px] h-[18px]" />
                  </div>
                  
                  {/* Content */}
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-medium text-sm truncate",
                          isActive ? "text-foreground" : ""
                        )}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "ml-2 text-xs px-2 py-0.5 h-5 font-medium",
                              isActive 
                                ? "bg-primary/15 text-primary border-primary/20" 
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate mt-0.5",
                        isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                      )}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Active indicator bar */}
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full"></div>
                  )}
                  
                  {/* Collapsed tooltip */}
                  {collapsed && hoveredItem === item.name && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50">
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg min-w-[140px]">
                        <p className="font-medium text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        {item.badge && (
                          <Badge variant="secondary" className="mt-1.5 text-xs bg-muted">
                            {item.badge} new
                          </Badge>
                        )}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-3 h-3 bg-popover border-l border-b border-border transform rotate-45"></div>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="relative z-10 p-3 border-t border-border space-y-3">
        {!collapsed && (
          <div className="bg-muted/50 rounded-lg p-3.5 border border-border">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">Pro Tip</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload your CSV trades to get started with detailed analytics and insights
            </p>
          </div>
        )}
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200 rounded-lg",
            collapsed && "w-10 h-10 p-0 mx-auto justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Button>
      </div>
      
    </div>
  );
}
