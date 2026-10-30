import { NavLink } from "react-router-dom";
import styles from './MainLayout.module.css';
import {routes} from "../../router/routes";



export function MainLayout() {
    return (
        <div className={styles.mainLayout}>
            <header className={styles.header}>
                <h1>DnD Game</h1>
            </header>
            <main className={styles.main}>
                <nav className={styles.navLinks}>

                    <NavLink to={routes.home} end>
                        Главная
                    </NavLink>
                    <NavLink to={routes.characters}>
                        Персонажи
                    </NavLink>
                    <NavLink to={routes.npc}>
                        NPC
                    </NavLink>
                    <NavLink to={routes.club}>
                        Клуб
                    </NavLink>
                    <NavLink to={routes.map}>
                        Карта
                    </NavLink>
                    <NavLink to={routes.notes}>
                        Заметки
                    </NavLink>
                </nav>
            </main>
            <footer>
                <p>&copy; 2023 DnD Game. All rights reserved.</p>
            </footer>
        </div>
    );
}