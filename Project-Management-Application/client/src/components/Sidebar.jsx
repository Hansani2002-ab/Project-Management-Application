import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import WorkspaceDropdown from './WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {

    const {openUserProfile} = useClerk()

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Team', href: '/team', icon: UsersIcon },
    ]

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <div
            ref={sidebarRef}
            className={`z-20 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/80 min-w-64 flex flex-col h-screen border-r border-slate-200/60 dark:border-zinc-800 max-sm:absolute transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-0' : '-left-full'}`}
        >

            {/* Workspace */}
            <div className="px-4 py-3">
                <WorkspaceDropdown />
            </div>

            <div className='mx-4 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-zinc-700' />

            <div className='flex-1 overflow-y-auto no-scrollbar flex flex-col mt-3'>

                <div className='px-3 space-y-1'>

                    {menuItems.map((item) => (
                        <NavLink
                            to={item.href}
                            key={item.name}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600'
                                }`
                            }
                        >
                            <item.icon
                                size={18}
                                className='transition-transform duration-200 group-hover:scale-110'
                            />
                            {item.name}
                        </NavLink>
                    ))}

                    {/* Settings */}
                    <button onClick={openUserProfile} className='group flex w-full items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 transition-all'>
                        <SettingsIcon size={18} className='group-hover:rotate-45 transition-transform duration-300' />
                        Settings
                    </button>
                </div>

                {/* Divider */}
                <div className="mt-5 mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-zinc-800" />

                {/* Sub sections */}
                <div className="mt-4 px-2 space-y-3">
                    <div className="rounded-xl bg-white/50 dark:bg-zinc-900/50 p-2 shadow-sm">
                        <MyTasksSidebar />
                    </div>

                    <div className="rounded-xl bg-white/50 dark:bg-zinc-900/50 p-2 shadow-sm">
                        <ProjectSidebar />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Sidebar