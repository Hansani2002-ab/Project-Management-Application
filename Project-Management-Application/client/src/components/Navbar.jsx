import { SearchIcon, PanelLeft } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { assets } from '../assets/assets'
import { UserButton } from '@clerk/clerk-react'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const { theme } = useSelector(state => state.theme);

    return (
        // UI Update: Added backdrop-blur for a glassmorphism effect and refined the border colors
        <div className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 dark:border-zinc-800 px-6 xl:px-16 py-2.5 flex-shrink-0">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                
                {/* Left section: Search and Sidebar Trigger */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger - Mobile Only */}
                    <button 
                        onClick={() => setIsSidebarOpen((prev) => !prev)} 
                        className="sm:hidden p-2 rounded-xl transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95" 
                    >
                        <PanelLeft size={20} />
                    </button>

                    {/* Modern Search Input: Added focus-ring-indigo and soft shadows */}
                    <div className="relative flex-1 max-w-sm group">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="pl-10 pr-4 py-2 w-full bg-slate-100 dark:bg-zinc-800/50 border-none rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Right section: Theme Toggle and Profile */}
                <div className="flex items-center gap-4">

                    {/* Theme Toggle: Updated to match modern aesthetics with smooth transitions */}
                    <button 
                        onClick={() => dispatch(toggleTheme())} 
                        className="size-9 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-90 border border-slate-200/50 dark:border-zinc-700/50"
                    >
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4.5 text-slate-700" />)
                                : (<SunIcon className="size-4.5 text-yellow-500" />)
                        }
                    </button>

                    {/* User Button: Clerk's UI wraps into our modern theme */}
                    <div className="pl-2 border-l border-slate-200 dark:border-zinc-800 h-6 flex items-center">
                        <UserButton 
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "size-8 rounded-xl border border-slate-200 dark:border-zinc-700"
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar