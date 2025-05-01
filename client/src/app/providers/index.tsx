'use client';
import { ReactNode } from 'react';
import RainbowKitProvider from './rainbowkitProvide';

export default function Providers({
    children,
    cookie
}: {
    children: ReactNode;
    cookie: string;
}) {
    return (
        <RainbowKitProvider cookie={cookie}>{children}</RainbowKitProvider>
    );
}
