"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ImageAnalysis } from "@/components/tabs/image-analysis";
import { IngredientRecognition } from "@/components/tabs/ingredient-recognition";
import { ImageCreator } from "@/components/tabs/image-creator";

export function AiDemo() {
  return (
    <Tabs defaultValue="analysis" className="w-full">
      <TabsList>
        <TabsTrigger value="analysis">Image analysis</TabsTrigger>
        <TabsTrigger value="ingredients">Ingredient recognition</TabsTrigger>
        <TabsTrigger value="creator">Image creator</TabsTrigger>
      </TabsList>

      <Card className="mt-4">
        <CardContent>
          <TabsContent value="analysis">
            <ImageAnalysis />
          </TabsContent>
          <TabsContent value="ingredients">
            <IngredientRecognition />
          </TabsContent>
          <TabsContent value="creator">
            <ImageCreator />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
