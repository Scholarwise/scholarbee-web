'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

export function OrganizationsProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchOrganizations = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const orgs = Array.isArray(data) ? data : (data.organizations || []);
                setOrganizations(orgs);

                // Set active org from localStorage or first org
                const savedOrg = localStorage.getItem('current_org');
                if (savedOrg) {
                    const parsed = JSON.parse(savedOrg);
                    const found = orgs.find((o: Organization) => o.id === parsed.id);
                    if (found) {
                        setActiveOrgState(found);
                    } else if (orgs.length > 0) {
                        setActiveOrgState(orgs[0]);
                        localStorage.setItem('current_org', JSON.stringify(orgs[0]));
                    }
                } else if (orgs.length > 0) {
                    setActiveOrgState(orgs[0]);
                    localStorage.setItem('current_org', JSON.stringify(orgs[0]));
                }
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    }, []);

    // Fetch once on mount, or if token changes
    useEffect(() => {
        if (!hasFetched) {
            fetchOrganizations();
        }
    }, [hasFetched, fetchOrganizations]);

    const setActiveOrg = useCallback((org: Organization) => {
        setActiveOrgState(org);
        localStorage.setItem('current_org', JSON.stringify(org));
    }, []);

    const refreshOrganizations = useCallback(async () => {
        setIsLoading(true);
        await fetchOrganizations();
    }, [fetchOrganizations]);

    return (
        <OrganizationsContext.Provider value={{
            organizations,
            activeOrg,
            isLoading,
            setActiveOrg,
            refreshOrganizations
        }}>
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
