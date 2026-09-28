module Kripke.Checker
  ( testModel
  , verifyModel
  , satisfies
  , validInModel
  ) where

import qualified Data.Set as Set
import qualified Data.Map as Map
import qualified Data.Maybe as Maybe

import Kripke.Types

testModel :: Model
testModel = Model
  { worlds = Set.fromList ["1", "2", "3"]
  , relation = Map.fromList
      [ ("1", Set.fromList ["2", "3"])
      , ("2", Set.fromList ["3"])
      , ("3", Set.empty)
      ]
  , valuation = Map.fromList
      [ ("1", Set.fromList ['p', 'q'])
      , ("2", Set.fromList ['q'])
      , ("3", Set.fromList ['p'])
      ]
  }

-- is every world mentioned in the relation and valuation inside the worlds set
-- is every world in worlds mentioned as a key in relation or valuation
verifyModel :: Model -> Bool
verifyModel m = Set.isSubsetOf allSets (worlds m) && Set.isSubsetOf (worlds m) (Set.intersection relationKeysSet valuationKeysSet)
    where
        valuationKeysSet = Map.keysSet (valuation m)
        relationKeysSet = Map.keysSet (relation m)
        relationValuesSet = Map.foldr Set.union Set.empty (relation m)
        allSets = Set.union relationValuesSet (Set.union valuationKeysSet relationKeysSet)

-- assumes the given World to check exists in Worlds given we call verifyModel first and will call a seperate verifier that the given world does exist
satisfies :: Model -> Formula -> World -> Bool
satisfies _ Top _ = True
satisfies _ Bot _ = False
satisfies m (P p) w = Set.member p propsAtWorld
    where
        propsAtWorld = Maybe.fromJust (Map.lookup w (valuation m))
satisfies m (Not f) w = not (satisfies m f w)
satisfies m (And a b) w = satisfies m a w && satisfies m b w
satisfies m (Box f) w = all (satisfies m f) connectedSet
    where
        connectedSet = Set.toList $ Maybe.fromJust (Map.lookup w (relation m))

-- checks if the given formula satisfies over all worlds of the model and returns a set of the ones that do
validInModel :: Model -> Formula -> Worlds
validInModel m f = Set.fromList [world | world <- Set.toList $ worlds m, satisfies m f world]
