'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    is_system_org?: boolean;
}

interface OrganizationsContextType {
    organizations: Organization[];
    activeOrg: Organization | null;
    isLoading: boolean;
    setActiveOrg: (org: Organization) => void;
    refreshOrganizations: () => Promise<void>;
}

const OrganizationsContext = createContext<OrganizationsContextType | undefined>(undefined);

const CACHE_KEY = 'orgs_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheData {
    organizations: Organization[];
    timestamp: number;
}

// Get cached orgs from sessionStorage
function getCachedOrgs(): Organization[] | null {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const data: CacheData = JSON.parse(cached);
            // Check if cache is still valid (within TTL)
            if (Date.now() - data.timestamp < CACHE_TTL) {
                return data.organizations;
            }
        }
    } catch { }
    return null;
}

// Save orgs to sessionStorage
function setCachedOrgs(orgs: Organization[]) {
    if (typeof window === 'undefined') return;
    try {
        const data: CacheData = {
            organizations: orgs,
            timestamp: Date.now()
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch { }
}

// Clear the cache
function clearCachedOrgs() {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(CACHE_KEY);
    } catch { }
}

// Helper to get active org from localStorage
function getActiveOrgFromStorage(orgs: Organization[]): Organization | null {
    if (typeof window === 'undefined') return null;
    try {
        const savedOrg = localStorage.getItem('current_org');
        if (savedOrg) {
            const parsed = JSON.parse(savedOrg);
            const found = orgs.find(o => o.id === parsed.id);
            if (found) return found;
        }
    } catch { }
    return orgs.length > 0 ? orgs[0] : null;
}

// Track in-flight fetch to prevent duplicate requests
let fetchPromise: Promise<Organization[]> | null = null;

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    // Initialize from sessionStorage cache immediately
    const [organizations, setOrganizations] = useState<Organization[]>(() => getCachedOrgs() || []);
    const [activeOrg, setActiveOrgState] = useState<Organization | null>(() => {
        const cached = getCachedOrgs();
        return cached ? getActiveOrgFromStorage(cached) : null;
    });
    const [isLoading, setIsLoading] = useState(() => getCachedOrgs() === null);
    const hasFetchedRef = useRef(false);

    const fetchOrganizations = useCallback(async (force = false): Promise<Organization[]> => {
        // Return cached data if available and not forcing refresh
        const cached = getCachedOrgs();
        if (!force && cached) {
            return cached;
        }

        // If fetch is already in progress, wait for it
        if (!force && fetchPromise) {
            return fetchPromise;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            return [];
        }

        fetchPromise = (async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const orgs = Array.isArray(data) ? data : (data.organizations || []);
                    setCachedOrgs(orgs);
                    return orgs;
                }
                return [];
            } finally {
                fetchPromise = null;
            }
        })();

        return fetchPromise;
    }, []);

    // Initialize on mount - but only fetch if no cache
    useEffect(() => {
        // Already fetched in this component lifecycle
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        // If we have cached data, use it directly (no state updates needed, already initialized)
        const cached = getCachedOrgs();
        if (cached && cached.length > 0) {
            // Only update if different from initial state
            return;
        }

        // No cache, fetch from API
        const init = async () => {
            setIsLoading(true);
            const orgs = await fetchOrganizations();
            setOrganizations(orgs);

            const active = getActiveOrgFromStorage(orgs);
            if (active) {
                setActiveOrgState(active);
                localStorage.setItem('current_org', JSON.stringify(active));
            }
            setIsLoading(false);
        };

        init();
    }, [fetchOrganizations]);

    const setActiveOrg = useCallback((org: Organization) => {
        setActiveOrgState(org);
        localStorage.setItem('current_org', JSON.stringify(org));
    }, []);

    const refreshOrganizations = useCallback(async () => {
        setIsLoading(true);
        clearCachedOrgs();
        hasFetchedRef.current = false;
        const orgs = await fetchOrganizations(true);
        setOrganizations(orgs);
        setIsLoading(false);
    }, [fetchOrganizations]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        organizations,
        activeOrg,
        isLoading,
        setActiveOrg,
        refreshOrganizations
    }), [organizations, activeOrg, isLoading, setActiveOrg, refreshOrganizations]);

    return (
        <OrganizationsContext.Provider value={contextValue}>
            {children}
        </OrganizationsContext.Provider>
    );
}

export function useOrganizations() {
    const context = useContext(OrganizationsContext);
    if (context === undefined) {
        throw new Error('useOrganizations must be used within an OrganizationsProvider');
    }
    return context;
}
