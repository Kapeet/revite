import { observer } from "mobx-react-lite";

import styles from "./Panes.module.scss";
import { Text } from "preact-i18n";
import { useMemo } from "preact/hooks";

import { H3 } from "@revoltchat/ui/lib/components/atoms/heading/H3";
import { Checkbox } from "@revoltchat/ui/lib/components/atoms/inputs/Checkbox";
import { LineDivider } from "@revoltchat/ui/lib/components/atoms/layout/LineDivider";
import { Tip } from "@revoltchat/ui/lib/components/atoms/layout/Tip";

import { useApplicationState } from "../../../mobx/State";

import {
    Language,
    LanguageEntry,
    Languages as Langs,
} from "../../../context/Locale";

import Emoji from "../../../components/common/Emoji";
import enchantingTableWEBP from "../assets/enchanting_table.webp";
import esperantoFlagSVG from "../assets/esperanto.svg";
import tamilFlagPNG from "../assets/tamil_nadu_flag.png";
import tokiponaSVG from "../assets/toki_pona.svg";

type Key = [Language, LanguageEntry];

interface Props {
    entry: Key;
    selected: boolean;
    onSelect: () => void;
}

/**
 * Component providing individual language entries.
 * @param param0 Entry data
 */
function Entry({ entry: [x, lang], selected, onSelect }: Props) {
    return (
        <Checkbox
            key={x}
            className={styles.entry}
            value={selected}
            title={
                <>
                    <div className={styles.flag}>
                        {lang.i18n === "eo" ? (
                            <img
                                src={esperantoFlagSVG}
                                width={42}
                                loading="lazy"
                                style={{
                                    objectFit: "contain",
                                    borderRadius: "6px",
                                }}
                            />
                        ) : lang.i18n === "ta" ? (
                            <img
                                src={tamilFlagPNG}
                                width={42}
                                loading="lazy"
                                style={{ objectFit: "contain" }}
                            />
                        ) : lang.emoji === "🙂" ? (
                            <img src={tokiponaSVG} width={42} loading="lazy" />
                        ) : lang.emoji === "🪄" ? (
                            <img
                                src={enchantingTableWEBP}
                                width={42}
                                loading="lazy"
                                style={{ objectFit: "contain" }}
                            />
                        ) : (
                            <Emoji size={42} emoji={lang.emoji} />
                        )}
                    </div>
                    {lang.display}
                </>
            }
            onChange={onSelect}></Checkbox>
    );
}

/**
 * Component providing the language selection menu.
 */
export const Languages = observer(() => {
    const locale = useApplicationState().locale;
    const language = locale.getLanguage();

    // Generate languages array.
    const languages = useMemo(() => {
        const languages = Object.keys(Langs).map((x) => [
            x,
            Langs[x as keyof typeof Langs],
        ]) as Key[];

        // Get the user's system language. Check for exact
        // matches first, otherwise check for partial matches
        const preferredLanguage =
            navigator.languages.filter((lang) =>
                languages.find((l) => l[0].replace(/_/g, "-") == lang),
            )?.[0] ||
            navigator.languages
                ?.map((x) => x.split("-")[0])
                ?.filter((lang) => languages.find((l) => l[0] == lang))?.[0]
                ?.split("-")[0];

        if (preferredLanguage) {
            // This moves the user's system language to the top of the language list
            const prefLangKey = languages.find(
                (lang) => lang[0].replace(/_/g, "-") == preferredLanguage,
            );

            if (prefLangKey) {
                languages.splice(
                    0,
                    0,
                    languages.splice(languages.indexOf(prefLangKey), 1)[0],
                );
            }
        }

        return languages;
    }, []);

    // Creates entries with given key.
    const EntryFactory = ([x, lang]: Key) => (
        <Entry
            key={x}
            entry={[x, lang]}
            selected={language === x}
            onSelect={() => locale.setLanguage(x)}
        />
    );

    return (
        <div className={styles.languages}>
            <H3>
                <Text id="app.settings.pages.language.select" />
            </H3>
            <div className={styles.list}>
                {languages.filter(([, lang]) => !lang.cat).map(EntryFactory)}
            </div>
            <H3>
                <Text id="app.settings.pages.language.const" />
            </H3>
            <div className={styles.list}>
                {languages
                    .filter(([, lang]) => lang.cat === "const")
                    .map(EntryFactory)}
            </div>
            <H3>
                <Text id="app.settings.pages.language.other" />
            </H3>
            <div className={styles.list}>
                {languages
                    .filter(([, lang]) => lang.cat === "alt")
                    .map(EntryFactory)}
            </div>
            <LineDivider />
            <Tip>
                <span>
                    <Text id="app.settings.tips.languages.a" />{" "}
                    <a
                        href="https://weblate.insrt.uk/engage/revolt/?utm_source=widget"
                        target="_blank"
                        rel="noreferrer">
                        <Text id="app.settings.tips.languages.b" />
                    </a>
                </span>
            </Tip>
        </div>
    );
});
