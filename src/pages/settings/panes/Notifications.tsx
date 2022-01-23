import { observer } from "mobx-react-lite";

import styles from "./Panes.module.scss";
import { Text } from "preact-i18n";
import { useContext, useEffect, useState } from "preact/hooks";

import { H3 } from "@revoltchat/ui/lib/components/atoms/heading/H3";
import { Checkbox } from "@revoltchat/ui/lib/components/atoms/inputs/Checkbox";
import { LineDivider } from "@revoltchat/ui/lib/components/atoms/layout/LineDivider";

import { urlBase64ToUint8Array } from "../../../lib/conversion";

import { useApplicationState } from "../../../mobx/State";

import { useIntermediate } from "../../../context/intermediate/Intermediate";
import { AppContext } from "../../../context/revoltjs/RevoltClient";

export const Notifications = observer(() => {
    const client = useContext(AppContext);
    const { openScreen } = useIntermediate();
    const settings = useApplicationState().settings;
    const [pushEnabled, setPushEnabled] = useState<undefined | boolean>(
        undefined,
    );

    // Load current state of pushManager.
    useEffect(() => {
        navigator.serviceWorker
            ?.getRegistration()
            .then(async (registration) => {
                const sub = await registration?.pushManager?.getSubscription();
                setPushEnabled(sub !== null && sub !== undefined);
            });
    }, []);

    return (
        <div className={styles.notifications}>
            <H3>
                <Text id="app.settings.pages.notifications.push_notifications" />
            </H3>
            <Checkbox
                disabled={!("Notification" in window)}
                value={settings.get("notifications:desktop", false)!}
                title={
                    <Text id="app.settings.pages.notifications.enable_desktop" />
                }
                description={
                    <Text id="app.settings.pages.notifications.descriptions.enable_desktop" />
                }
                onChange={async (desktopEnabled) => {
                    if (desktopEnabled) {
                        const permission =
                            await Notification.requestPermission();

                        if (permission !== "granted") {
                            return openScreen({
                                id: "error",
                                error: "DeniedNotification",
                            });
                        }
                    }

                    settings.set("notifications:desktop", desktopEnabled);
                }}></Checkbox>
            <Checkbox
                disabled={typeof pushEnabled === "undefined"}
                value={pushEnabled ?? false}
                title={
                    <Text id="app.settings.pages.notifications.enable_push" />
                }
                description={
                    <Text id="app.settings.pages.notifications.descriptions.enable_push" />
                }
                onChange={async (pushEnabled) => {
                    try {
                        const reg =
                            await navigator.serviceWorker?.getRegistration();
                        if (reg) {
                            if (pushEnabled) {
                                const sub = await reg.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: urlBase64ToUint8Array(
                                        client.configuration!.vapid,
                                    ),
                                });

                                // tell the server we just subscribed
                                const json = sub.toJSON();
                                if (json.keys) {
                                    client.req("POST", "/push/subscribe", {
                                        endpoint: sub.endpoint,
                                        ...(json.keys as {
                                            p256dh: string;
                                            auth: string;
                                        }),
                                    });
                                    setPushEnabled(true);
                                }
                            } else {
                                const sub =
                                    await reg.pushManager.getSubscription();
                                sub?.unsubscribe();
                                setPushEnabled(false);

                                client.req("POST", "/push/unsubscribe");
                            }
                        }
                    } catch (err) {
                        console.error("Failed to enable push!", err);
                    }
                }}></Checkbox>
            <LineDivider />
            <H3>
                <Text id="app.settings.pages.notifications.sounds" />
            </H3>
            {settings.sounds.getState().map(({ id, enabled }) => (
                <Checkbox
                    key={id}
                    value={enabled}
                    title={
                        <Text
                            id={`app.settings.pages.notifications.sound.${id}`}
                        />
                    }
                    onChange={(enabled) =>
                        settings.sounds.setEnabled(id, enabled)
                    }></Checkbox>
            ))}
        </div>
    );
});
