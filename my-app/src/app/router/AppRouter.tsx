import { Route, Routes } from 'react-router-dom'
import { ClubPage } from '../../pages/club'
import { CharacterDetailsPage } from '../../pages/character-details'
import { CharactersPage } from '../../pages/characters'
import { HomePage } from '../../pages/home'
import { MapPage } from '../../pages/map'
import { NotesPage } from '../../pages/notes'
import { NotFoundPage } from '../../pages/not-found'
import { NpcDetailsPage } from '../../pages/npc-details'
import { NpcPage } from '../../pages/npc'
import { MainLayout } from '../layouts/MainLayout'
import { routes } from './routes'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.characters} element={<CharactersPage />} />
        <Route
          path={routes.characterDetails}
          element={<CharacterDetailsPage />}
        />
        <Route path={routes.npc} element={<NpcPage />} />
        <Route path={routes.npcDetails} element={<NpcDetailsPage />} />
        <Route path={routes.club} element={<ClubPage />} />
        <Route path={routes.map} element={<MapPage />} />
        <Route path={routes.notes} element={<NotesPage />} />
        <Route path={routes.notFound} element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
