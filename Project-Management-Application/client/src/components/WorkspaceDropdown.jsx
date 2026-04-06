import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";
import { useClerk, useOrganizationList } from "@clerk/clerk-react";

function WorkspaceDropdown() {
    // userMemberships load වන තෙක් බලා සිටීමට isLoaded පාවිච්චි කරයි
    const { setActive, userMemberships, isLoaded } = useOrganizationList({
        userMemberships: true,
    });

    const { openCreateOrganization } = useClerk();
    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSelectWorkspace = (organizationId) => {
        setActive({ organization: organizationId });
        dispatch(setCurrentWorkspace(organizationId));
        setIsOpen(false);
        navigate('/');
    };

    
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    
    if (!isLoaded) return <div className="m-4 text-xs text-gray-400">Loading workspaces...</div>;

    return (
        <div className="relative m-4" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(prev => !prev)} 
                className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded shadow overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {currentWorkspace?.image_url ? (
                            <img 
                                src={currentWorkspace.image_url} 
                                alt={currentWorkspace.name} 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            currentWorkspace?.name?.charAt(0).toUpperCase() || "W"
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {currentWorkspace?.name || "Select Workspace"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {userMemberships?.data?.length || 0} workspace{(userMemberships?.data?.length !== 1) ? "s" : ""}
                        </p>
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0 ml-2" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow-lg top-full left-0 mt-1 overflow-hidden">
                    <div className="p-2 max-h-60 overflow-y-auto">
                        <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2 py-1">
                            Your Workspaces
                        </p>
                        
                        {/* Clerk වෙතින් ලැබෙන දත්ත ලැයිස්තුව */}
                        {userMemberships?.data?.map((membership) => {
                            const { organization } = membership; 
                            return (
                                <div 
                                    key={organization.id} 
                                    onClick={() => onSelectWorkspace(organization.id)} 
                                    className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="w-7 h-7 rounded overflow-hidden bg-indigo-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                                        {organization.imageUrl ? (
                                            <img 
                                                src={organization.imageUrl} 
                                                alt={organization.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            organization.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                            {organization.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                            {organization.membersCount || 0} members 
                                        </p>
                                    </div>
                                    {currentWorkspace?.id === organization.id && (
                                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <hr className="border-gray-200 dark:border-zinc-700" />

                    <div 
                        onClick={() => { openCreateOrganization(); setIsOpen(false); }}
                        className="p-3 cursor-pointer rounded-b group hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <p className="flex items-center text-xs gap-2 w-full text-indigo-600 dark:text-indigo-400 font-medium">
                            <Plus className="w-4 h-4" /> Create Workspace
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkspaceDropdown;