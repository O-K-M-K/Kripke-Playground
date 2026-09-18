import qualified Data.Set as Set
import qualified Data.Map as Map
import qualified Data.Maybe as Maybe


newtype Props = Props Char deriving (Eq, Ord, Show)
type World = String 
type Worlds = Set.Set World
type Relation = Map.Map World (Set.Set World)
type Valuation = Map.Map World (Set.Set Props)


-- Minimal Grammar 
data Formula  = P Props | Not Formula  | And Formula  Formula  | Box Formula deriving (Eq, Show)

data Model = Model { worlds :: Worlds, relation :: Relation, valuation :: Valuation }


or_ :: Formula -> Formula -> Formula 
or_ a b = Not (And (Not a) (Not b))

diamond :: Formula -> Formula 
diamond f = Not (Box (Not f))

implies :: Formula -> Formula -> Formula 
implies a b = Not (And a (Not b))


testModel :: Model
testModel = Model
  { worlds = Set.fromList ["1", "2", "3"]
  , relation = Map.fromList
      [ ("1", Set.fromList ["2", "3"])
      , ("2", Set.fromList ["3"])
      , ("3", Set.empty)
      ]
  , valuation = Map.fromList
      [ ("1", Set.fromList [Props 'p', Props 'q'])
      , ("2", Set.fromList [Props 'q'])
      , ("3", Set.fromList [Props 'p'])
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
satisfies  m (P p) w = Set.member p propsAtWorld
    where
        propsAtWorld = Maybe.fromJust (Map.lookup w (valuation m))
satisfies m (Not f) w = not (satisfies m f w)
satisfies m (And a b) w = satisfies m a w && satisfies m b w 
satisfies m (Box f) w = all (satisfies m f) connectedSet
    where 
        connectedSet = Set.toList $ Maybe.fromJust (Map.lookup w (relation m))


-- new function satisfiesAll checks if the given formula satisfies over all worlds of the model and returns a set of the ones that do
validInModel :: Model -> Formula -> Worlds 
-- validInModel m f = map (satisfies m f) (Set.toList $ worlds m)
validInModel m f = Set.fromList [world | world <- Set.toList $ worlds m, satisfies m f world]
